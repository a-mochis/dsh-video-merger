// dsh-video-merger — host entry.
// Registers HTTP endpoints used by the Web UI plus a `merge_folder_videos`
// tool that lets the agent run the same pipeline.
import fsp from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  MergeRunner,
  FfmpegInstaller,
  resolveFfmpeg,
  invalidateFfmpegCache,
  loadConfig,
  saveConfig,
  scanRoot,
  formatBytes,
  fmtDuration,
} from "./engine.js";

export const name = "dsh-video-merger";

const PREFIX = "/plugins/dsh-video-merger";

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function readJson(req, limit = 2 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error("请求体过大");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("请求体不是合法 JSON");
  }
}

function badPath(p) {
  return typeof p !== "string" || p.trim() === "";
}

async function requireDir(p) {
  if (badPath(p)) throw new Error("缺少目录路径");
  const abs = path.resolve(p.trim());
  const stat = await fsp.stat(abs).catch(() => null);
  if (!stat) throw new Error(`目录不存在：${abs}`);
  if (!stat.isDirectory()) throw new Error(`不是目录：${abs}`);
  return abs;
}

export function apply(ctx, config = {}) {
  const log = (message) => {
    try { console.log(message); } catch {}
  };
  let cfg = null;
  const getConfig = async () => (cfg ||= await loadConfig());

  const getFfmpeg = async (refresh = false) => {
    const current = await getConfig();
    return resolveFfmpeg({ config: current, refresh });
  };

  const runner = new MergeRunner({ getFfmpeg, log });
  const installer = new FfmpegInstaller({
    config: null,
    onDone: () => { installer.config = null; },
  });

  const routes = [];
  const route = (p, handler) => routes.push({ path: `${PREFIX}${p}`, handler });

  route("/health", async (req, res) => {
    const current = await getConfig();
    const ff = await getFfmpeg();
    json(res, 200, {
      ok: true,
      ffmpeg: ff,
      dataDir: path.dirname(path.dirname(ff.ffmpegDir || "")) || "",
      config: { ffmpegDir: current.ffmpegDir },
      canInstall: process.platform === "win32",
      job: runner.state ? {
        status: runner.state.status,
        running: runner.running,
        overallProgress: runner.state.overallProgress || 0,
        totalFolders: runner.state.totalFolders,
      } : null,
      install: installer.snapshot(),
    });
  });

  route("/scan", async (req, res) => {
    const body = await readJson(req);
    const root = await requireDir(body.root);
    const folders = await scanRoot(root, {
      recursive: body.recursive !== false,
      order: body.order === "mtime" ? "mtime" : "name",
    });
    const totals = {
      folders: folders.length,
      videos: folders.reduce((n, f) => n + f.count, 0),
      bytes: folders.reduce((n, f) => n + f.totalSize, 0),
      mergeable: folders.filter((f) => f.count >= 2).length,
    };
    json(res, 200, { root, folders, totals });
  });

  route("/merge", async (req, res) => {
    const body = await readJson(req);
    const root = await requireDir(body.root);
    if (runner.running) {
      json(res, 409, { error: "已有合并任务正在运行，请先等待完成或取消" });
      return;
    }
    let folders = [];
    if (Array.isArray(body.folders) && body.folders.length > 0) {
      for (const item of body.folders) {
        const p = await requireDir(item);
        folders.push({
          id: path.relative(root, p) || ".",
          path: p,
          name: path.basename(p),
          count: 0,
          totalSize: 0,
        });
      }
    } else {
      folders = await scanRoot(root, { recursive: body.options?.recursive !== false });
      folders = folders.filter((f) => f.count >= 2);
    }
    if (folders.length === 0) {
      json(res, 400, { error: "没有找到可合并的文件夹（每个文件夹至少需要 2 个视频）" });
      return;
    }
    const options = { ...(body.options || {}) };
    if (options.outputDir) {
      options.outputDir = path.resolve(String(options.outputDir));
      await fsp.mkdir(options.outputDir, { recursive: true });
    } else {
      options.outputDir = "";
    }
    const state = runner.start({ root, folders, options });
    json(res, 200, { jobId: state.id, totalFolders: state.totalFolders });
  });

  route("/job", async (req, res) => {
    json(res, 200, { job: runner.snapshot(), install: installer.snapshot() });
  });

  route("/cancel", async (req, res) => {
    const ok = runner.cancel();
    json(res, 200, { ok, job: runner.snapshot() });
  });

  route("/ffmpeg/install", async (req, res) => {
    if (process.platform !== "win32") {
      json(res, 400, { error: "自动下载 ffmpeg 目前仅支持 Windows；请用系统包管理器安装 ffmpeg，或指定已有目录。" });
      return;
    }
    const body = await readJson(req);
    const current = await getConfig();
    installer.config = body.downloadUrl ? { ...current, downloadUrl: body.downloadUrl } : current;
    try {
      const state = installer.start();
      json(res, 200, state);
    } catch (error) {
      json(res, 409, { error: String(error.message || error) });
    }
  });

  route("/ffmpeg/install/status", async (req, res) => {
    json(res, 200, installer.snapshot());
  });

  route("/config", async (req, res) => {
    const body = await readJson(req);
    const current = await getConfig();
    if (typeof body.ffmpegDir === "string") {
      const dir = body.ffmpegDir.trim();
      if (dir) {
        const abs = path.resolve(dir);
        const st = await fsp.stat(abs).catch(() => null);
        const stat = st && st.isFile() ? await fsp.stat(path.dirname(abs)).catch(() => null) : st;
        if (!st) throw new Error(`路径不存在：${abs}`);
        if (st.isDirectory()) {
          await saveConfig({ ffmpegDir: abs });
        } else {
          await saveConfig({ ffmpegDir: path.dirname(abs) });
        }
      } else {
        await saveConfig({ ffmpegDir: "" });
      }
      invalidateFfmpegCache();
    }
    cfg = await loadConfig();
    const ff = await getFfmpeg(true);
    json(res, 200, { config: { ffmpegDir: cfg.ffmpegDir }, ffmpeg: ff });
  });

  route("/reveal", async (req, res) => {
    const body = await readJson(req);
    if (badPath(body.path)) throw new Error("缺少路径");
    const abs = path.resolve(body.path);
    const st = await fsp.stat(abs).catch(() => null);
    if (!st) throw new Error(`路径不存在：${abs}`);
    if (process.platform === "win32") {
      if (st.isDirectory()) spawn("explorer", [abs], { detached: true, windowsHide: true }).unref();
      else spawn("explorer", ["/select,", abs], { detached: true, windowsHide: true }).unref();
    } else {
      spawn("xdg-open", [st.isDirectory() ? abs : path.dirname(abs)], { detached: true }).unref();
    }
    json(res, 200, { ok: true });
  });

  route("/open", async (req, res) => {
    const body = await readJson(req);
    if (badPath(body.path)) throw new Error("缺少路径");
    const abs = path.resolve(body.path);
    const st = await fsp.stat(abs).catch(() => null);
    if (!st) throw new Error(`路径不存在：${abs}`);
    if (process.platform === "win32") spawn("explorer", [abs], { detached: true, windowsHide: true }).unref();
    else spawn("xdg-open", [abs], { detached: true }).unref();
    json(res, 200, { ok: true });
  });

  ctx.inject(["webServer"], (webCtx) => {
    for (const item of routes) {
      webCtx.effect(() => webCtx.webServer.register({
        kind: "exact",
        path: item.path,
        handler: async (req, res) => {
          try {
            await item.handler(req, res);
          } catch (error) {
            if (res.headersSent) {
              try { res.end(); } catch {}
              return;
            }
            json(res, 500, { error: String(error && error.message ? error.message : error) });
          }
        },
      }), `dsh-video-merger: ${item.path}`);
    }
  });

  ctx.inject(["tools"], (toolsCtx) => {
    toolsCtx.tools.register({
      name: "merge_folder_videos",
      description:
        "Merge the videos inside each folder into a single video without changing the video spec (resolution/frame rate/codec). " +
        "If a folder's clips differ, they are transcoded to the first clip's spec when reencodeFallback is true. " +
        "Use the dsh-video-merger tab in the Web UI for a live progress view.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          root: { type: "string", description: "Root directory to scan. Every folder containing at least two videos is merged." },
          folder: { type: "string", description: "Optional: merge only this single folder instead of scanning root." },
          recursive: { type: "boolean", description: "Scan sub-folders recursively (default true)." },
          overwrite: { type: "boolean", description: "Overwrite an existing output file (default false: auto-rename)." },
          reencodeFallback: { type: "boolean", description: "Transcode mismatched clips to the first clip's spec (default true)." },
          deleteSource: { type: "boolean", description: "Delete source videos after a successful merge (default false)." },
          order: { type: "string", enum: ["name", "mtime"], description: "Clip order inside a folder (default name)." },
          outputDir: { type: "string", description: "Optional: put every merged video in this single folder (created if missing). Omit to keep each output inside its source folder." },
          wait: { type: "boolean", description: "Wait for the merge to finish (default true)." },
        },
        required: ["root"],
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: true,
          properties: {
            summary: { type: "string" },
            started: { type: "boolean" },
            jobId: { type: "string" },
            folders: { type: "array" },
          },
        },
        render: (args, value) => [{ type: "text", text: value.summary || JSON.stringify(value) }],
      },
      timeoutMs: 60 * 60 * 1000,
      async execute(args, exec) {
        const ff = await getFfmpeg();
        if (!ff.available) throw new Error("未找到 ffmpeg/ffprobe。请先在 Web UI 的“视频合并”页点击“自动下载 ffmpeg”，或用 merge_folder_videos 之外的界面指定 ffmpeg 目录。");
        if (runner.running) throw new Error("已有合并任务正在运行，请先取消或等待完成");
        const root = await requireDir(args.root);
        let folders;
        if (args.folder) {
          const p = await requireDir(args.folder);
          folders = [{ id: path.relative(root, p) || ".", path: p, name: path.basename(p), count: 0, totalSize: 0 }];
        } else {
          folders = (await scanRoot(root, { recursive: args.recursive !== false, order: args.order === "mtime" ? "mtime" : "name" }))
            .filter((f) => f.count >= 2);
        }
        if (!folders.length) return { summary: "没有找到包含至少 2 个视频的文件夹。", folders: [] };
        const options = {
          recursive: args.recursive !== false,
          overwrite: Boolean(args.overwrite),
          reencodeFallback: args.reencodeFallback !== false,
          deleteSource: Boolean(args.deleteSource),
          order: args.order === "mtime" ? "mtime" : "name",
          outputDir: args.outputDir ? path.resolve(String(args.outputDir)) : "",
        };
        if (options.outputDir) await fsp.mkdir(options.outputDir, { recursive: true });
        const started = runner.start({ root, folders, options });
        if (args.wait === false) {
          return {
            started: true,
            jobId: started.id,
            summary: `已开始合并 ${folders.length} 个文件夹（任务 ${started.id}）。在 Web UI 的“视频合并”标签页查看进度。`,
            folders: [],
          };
        }
        const onAbort = () => runner.cancel();
        if (exec && exec.signal) exec.signal.addEventListener("abort", onAbort);
        let final;
        try {
          final = await runner.done;
        } finally {
          if (exec && exec.signal) exec.signal.removeEventListener("abort", onAbort);
        }
        const foldersOut = (final?.folders || []).map((f) => ({
          name: f.name,
          path: f.path,
          status: f.status,
          output: f.output,
          message: f.message,
          outputBytes: f.outputSize,
          duration: fmtDuration(f.durationSec),
        }));
        const summary = final?.summary;
        const text = summary
          ? `完成 ${summary.done} 个、跳过 ${summary.skipped} 个、失败 ${summary.error} 个；共输出 ${formatBytes(summary.outputBytes)}。`
          : "合并任务已结束。";
        return {
          started: false,
          jobId: final?.id,
          summary: text,
          folders: foldersOut,
          status: final?.status,
        };
      },
    });
  });

  log(`[dsh-video-merger] host loaded (${routes.length} routes)`);
}
