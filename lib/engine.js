// Host-side engine for dsh-video-merger.
// Scans directories for videos, probes them, and merges each folder into one
// output file.  The fast path remuxes without re-encoding (bit-exact specs);
// the fallback normalises mismatched clips to the first clip's spec.
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import https from "node:https";
import { spawn } from "node:child_process";

export const VIDEO_EXTS = new Set([
  ".mp4", ".m4v", ".mkv", ".mov", ".avi", ".wmv", ".flv", ".webm",
  ".mpg", ".mpeg", ".m2ts", ".mts", ".ts", ".3gp", ".3g2", ".ogv",
  ".rm", ".rmvb", ".vob", ".asf", ".f4v", ".divx", ".dat",
]);

const IGNORED_DIRS = new Set([
  "node_modules", ".git", ".svn", ".hg", "$RECYCLE.BIN",
  "System Volume Information", "Windows", "Program Files", "Program Files (x86)",
  "AppData", "Music", "Pictures",
]);

const NATURAL = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export function isVideoName(name) {
  const ext = path.extname(name).toLowerCase();
  return VIDEO_EXTS.has(ext) && !isMergedOutput(name) && !name.endsWith(".part");
}

export function isMergedOutput(name) {
  return /_merged( \(\d+\))?\.[a-z0-9]+$/i.test(name);
}

export function naturalCompare(a, b) {
  return NATURAL.compare(a, b);
}

export function dataDir() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
  return path.join(home, "plugin-data", "dsh-video-merger");
}

const CONFIG_FILE = () => path.join(dataDir(), "config.json");

const DEFAULT_CONFIG = {
  ffmpegDir: "",
  downloadUrl: "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip",
  candidateDirs: [
    "D:\\software\\XJVideoTools\\Encoder\\STD64",
    "D:\\software\\XJVideoTools\\Encoder\\STD",
    "C:\\ffmpeg\\bin",
    "C:\\Program Files\\ffmpeg\\bin",
  ],
};

let configCache = null;

export async function loadConfig() {
  if (configCache) return configCache;
  let stored = {};
  try {
    stored = JSON.parse(await fsp.readFile(CONFIG_FILE(), "utf8"));
  } catch {
    stored = {};
  }
  configCache = { ...DEFAULT_CONFIG, ...stored };
  return configCache;
}

export async function saveConfig(patch) {
  const current = await loadConfig();
  configCache = { ...current, ...patch };
  await fsp.mkdir(dataDir(), { recursive: true });
  await fsp.writeFile(CONFIG_FILE(), JSON.stringify(configCache, null, 2), "utf8");
  return configCache;
}

function exeNames() {
  return process.platform === "win32" ? { ffmpeg: "ffmpeg.exe", ffprobe: "ffprobe.exe" } : { ffmpeg: "ffmpeg", ffprobe: "ffprobe" };
}

function looksLikeExe(p) {
  return /\.exe$/i.test(p) || process.platform !== "win32";
}

function dirOfFfmpeg(p) {
  return looksLikeExe(p) ? path.dirname(p) : p;
}

function existingDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function existingFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function pathDirs() {
  return (process.env.PATH || process.env.Path || "")
    .split(path.delimiter)
    .map((s) => s.trim())
    .filter(Boolean);
}

function candidateDirs(config) {
  const list = [];
  const push = (d) => {
    if (d && existingDir(d) && !list.includes(d)) list.push(d);
  };
  if (config.ffmpegDir) push(dirOfFfmpeg(config.ffmpegDir));
  if (process.env.FFMPEG_DIR) push(process.env.FFMPEG_DIR);
  if (process.env.FFMPEG_PATH) push(dirOfFfmpeg(process.env.FFMPEG_PATH));
  push(path.join(dataDir(), "bin"));
  for (const d of pathDirs()) push(d);
  for (const d of config.candidateDirs || []) push(d);
  return list;
}

let ffmpegCache = { at: 0, value: null };

export async function resolveFfmpeg({ config, refresh = false } = {}) {
  const cfg = config || (await loadConfig());
  const now = Date.now();
  if (!refresh && ffmpegCache.value && now - ffmpegCache.at < 15_000) return ffmpegCache.value;

  const names = exeNames();
  const attempted = [];
  for (const dir of candidateDirs(cfg)) {
    const ffmpeg = path.join(dir, names.ffmpeg);
    const ffprobe = path.join(dir, names.ffprobe);
    if (!existingFile(ffmpeg) || !existingFile(ffprobe)) continue;
    attempted.push(ffmpeg);
    const version = await readFfmpegVersion(ffmpeg);
    if (version) {
      const value = { available: true, ffmpeg, ffprobe, ffmpegDir: dir, version, source: dir === path.join(dataDir(), "bin") ? "managed" : "detected" };
      ffmpegCache = { at: now, value };
      return value;
    }
  }
  for (const p of [process.env.FFMPEG_PATH, cfg.ffmpegDir].filter(Boolean)) {
    if (looksLikeExe(p) && existingFile(p)) {
      const dir = path.dirname(p);
      const ffprobe = path.join(dir, names.ffprobe);
      if (existingFile(ffprobe)) {
        const version = await readFfmpegVersion(p);
        if (version) {
          const value = { available: true, ffmpeg: p, ffprobe, ffmpegDir: dir, version, source: "configured" };
          ffmpegCache = { at: now, value };
          return value;
        }
      }
    }
  }
  const value = { available: false, attempted, message: "ffmpeg / ffprobe not found" };
  ffmpegCache = { at: now, value };
  return value;
}

export function invalidateFfmpegCache() {
  ffmpegCache = { at: 0, value: null };
}

const encoderCache = new Map();

const ENCODER_CANDIDATES = {
  h264: [
    { name: "h264_nvenc", label: "NVENC", args: ["-preset", "p5", "-tune", "hq", "-rc", "vbr", "-cq", "23", "-b:v", "0"] },
    { name: "h264_qsv", label: "QSV", args: ["-preset", "medium", "-global_quality", "21"] },
    { name: "h264_amf", label: "AMF", args: ["-quality", "balanced", "-rc", "cqp", "-qp_i", "21", "-qp_p", "23"] },
    { name: "libx264", label: "x264", args: ["-preset", "veryfast", "-crf", "20"] },
  ],
  hevc: [
    { name: "hevc_nvenc", label: "NVENC HEVC", args: ["-preset", "p5", "-tune", "hq", "-rc", "vbr", "-cq", "22", "-b:v", "0"] },
    { name: "hevc_qsv", label: "QSV HEVC", args: ["-preset", "medium", "-global_quality", "22"] },
    { name: "hevc_amf", label: "AMF HEVC", args: ["-quality", "balanced", "-rc", "cqp", "-qp_i", "22", "-qp_p", "24"] },
    { name: "libx265", label: "x265", args: ["-preset", "fast", "-crf", "22"] },
  ],
};

async function testEncoder(ffmpeg, candidate) {
  try {
    await runCapture(ffmpeg, [
      "-hide_banner", "-loglevel", "error",
      "-f", "lavfi", "-i", "color=c=black:s=256x256:d=0.2:r=30",
      "-c:v", candidate.name, ...candidate.args, "-pix_fmt", "yuv420p",
      "-f", "null", "-",
    ], 12_000);
    return true;
  } catch {
    return false;
  }
}

export async function resolveEncoder(ffmpeg, codec = "h264") {
  const wanted = codec === "hevc" ? "hevc" : "h264";
  const key = `${ffmpeg}|${wanted}`;
  const cached = encoderCache.get(key);
  if (cached) return cached;
  for (const candidate of ENCODER_CANDIDATES[wanted]) {
    if (await testEncoder(ffmpeg, candidate)) {
      const value = { ...candidate, codec: wanted };
      encoderCache.set(key, value);
      return value;
    }
  }
  const fallback = wanted === "hevc"
    ? { name: "libx265", label: "x265", args: ["-preset", "fast", "-crf", "22"], codec: "hevc" }
    : { name: "libx264", label: "x264", args: ["-preset", "veryfast", "-crf", "20"], codec: "h264" };
  encoderCache.set(key, fallback);
  return fallback;
}

function readFfmpegVersion(bin) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(bin, ["-hide_banner", "-version"], { windowsHide: true });
    } catch {
      resolve("");
      return;
    }
    let out = "";
    const timer = setTimeout(() => {
      try { child.kill(); } catch {}
      resolve("");
    }, 8000);
    child.stdout.on("data", (d) => { out += d.toString(); });
    child.stderr.on("data", (d) => { out += d.toString(); });
    child.on("error", () => { clearTimeout(timer); resolve(""); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return resolve("");
      const m = /ffmpeg version ([^\s]+)/i.exec(out);
      resolve(m ? m[1] : "unknown");
    });
  });
}

// ---------------------------------------------------------------------------
// scanning
// ---------------------------------------------------------------------------

async function scanFolder(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const videos = [];
  for (const entry of entries) {
    if (!entry.isFile() || !isVideoName(entry.name)) continue;
    const full = path.join(dir, entry.name);
    let st;
    try {
      st = await fsp.stat(full);
    } catch {
      continue;
    }
    videos.push({ name: entry.name, path: full, size: st.size, mtimeMs: st.mtimeMs });
  }
  videos.sort((a, b) => naturalCompare(a.name, b.name));
  return videos;
}

export async function scanRoot(root, { recursive = true, maxDepth = 12, order = "name" } = {}) {
  const stat = await fsp.stat(root).catch(() => null);
  if (!stat) throw new Error(`目录不存在：${root}`);
  if (!stat.isDirectory()) throw new Error(`不是目录：${root}`);

  const folders = [];
  const queue = [{ dir: root, depth: 0 }];
  while (queue.length) {
    const { dir, depth } = queue.shift();
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    const subdirs = [];
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith(".") && depth < maxDepth) {
          subdirs.push(path.join(dir, entry.name));
        }
      }
    }
    const videos = await scanFolder(dir).catch(() => []);
    if (videos.length > 0) {
      if (order === "mtime") videos.sort((a, b) => a.mtimeMs - b.mtimeMs);
      const rel = path.relative(root, dir) || ".";
      folders.push({
        id: rel,
        path: dir,
        name: path.basename(dir),
        rel,
        videos,
        count: videos.length,
        totalSize: videos.reduce((n, v) => n + v.size, 0),
        outputExists: videos.some((v) => isMergedOutput(v.name)),
      });
    }
    if (recursive) {
      for (const sub of subdirs) queue.push({ dir: sub, depth: depth + 1 });
    }
  }
  folders.sort((a, b) => naturalCompare(a.rel, b.rel));
  return folders;
}

// ---------------------------------------------------------------------------
// probing
// ---------------------------------------------------------------------------

export async function probeMedia(ffprobe, file) {
  const { stdout } = await runCapture(ffprobe, [
    "-v", "error", "-print_format", "json", "-show_format", "-show_streams", file,
  ], 40_000);
  const data = JSON.parse(stdout);
  const streams = Array.isArray(data.streams) ? data.streams : [];
  const video = streams.find((s) => s.codec_type === "video" && !(s.disposition && s.disposition.attached_pic));
  if (!video) throw new Error("没有视频流");
  const audio = streams.find((s) => s.codec_type === "audio") || null;
  const duration = Number(data.format?.duration) || Number(video.duration) || 0;
  const rotation = (video.side_data_list || []).find((item) => item.rotation !== undefined)?.rotation
    ?? Number(video.tags?.rotate || 0);
  return {
    file,
    duration,
    size: Number(data.format?.size) || 0,
    formatStart: Number(data.format?.start_time) || 0,
    video: {
      codec: video.codec_name || "",
      width: Number(video.width) || 0,
      height: Number(video.height) || 0,
      pixFmt: video.pix_fmt || "",
      fps: video.r_frame_rate || video.avg_frame_rate || "0/0",
      avgFps: video.avg_frame_rate || "0/0",
      timeBase: video.time_base || "",
      bitrate: Number(video.bit_rate) || 0,
      profile: video.profile || "",
      level: Number(video.level) || 0,
      sar: video.sample_aspect_ratio || "",
      fieldOrder: video.field_order || "",
      colorSpace: video.color_space || "",
      colorPrimaries: video.color_primaries || "",
      colorTransfer: video.color_transfer || "",
      colorRange: video.color_range || "",
      rotation: Number(rotation) || 0,
      startTime: Number(video.start_time ?? data.format?.start_time) || 0,
    },
    audio: audio ? {
      codec: audio.codec_name || "",
      profile: audio.profile || "",
      sampleRate: Number(audio.sample_rate) || 0,
      channels: Number(audio.channels) || 0,
      channelLayout: audio.channel_layout || "",
      bitrate: Number(audio.bit_rate) || 0,
      startTime: Number(audio.start_time ?? data.format?.start_time) || 0,
    } : null,
  };
}

function parseRate(value) {
  const text = String(value || "");
  const [num, den] = text.split("/").map(Number);
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return 0;
  return num / den;
}

function isVfr(v) {
  const nominal = parseRate(v.fps);
  const average = parseRate(v.avgFps);
  if (!nominal || !average) return false;
  return Math.abs(nominal - average) / Math.max(nominal, average) > 0.005;
}

function videoSig(v) {
  return [v.codec, v.width, v.height, v.pixFmt, v.fps].join("|");
}

function audioSig(a) {
  return a ? [a.codec, a.sampleRate, a.channels].join("|") : "-";
}

function streamShape(probe) {
  return `${videoSig(probe.video)}#${audioSig(probe.audio)}`;
}

function videoCopySig(v) {
  return [
    v.codec, v.profile, v.level, v.width, v.height, v.pixFmt, v.fps, v.avgFps,
    v.sar, v.rotation, v.fieldOrder, v.colorSpace, v.colorPrimaries,
    v.colorTransfer, v.colorRange, v.timeBase,
  ].join("|");
}

function audioCopySig(a) {
  return a
    ? [a.codec, a.profile, a.sampleRate, a.channels, a.channelLayout].join("|")
    : "-";
}

function copySig(probe) {
  return `${videoCopySig(probe.video)}#${audioCopySig(probe.audio)}`;
}

function videoRemuxSig(v) {
  return [
    v.codec, v.profile, v.level, v.width, v.height, v.pixFmt, v.fps, v.avgFps,
    v.sar, v.rotation, v.fieldOrder, v.colorSpace, v.colorPrimaries,
    v.colorTransfer, v.colorRange,
  ].join("|");
}

function remuxSig(probe) {
  return `${videoRemuxSig(probe.video)}#${audioCopySig(probe.audio)}`;
}

function nearZero(value, tolerance = 0.05) {
  return Math.abs(Number(value) || 0) <= tolerance;
}

function isTsFriendly(probe) {
  const videoCodec = probe.video.codec;
  if (!["h264", "hevc", "mpeg2video", "mpeg4"].includes(videoCodec)) return false;
  if (!probe.audio) return true;
  return ["aac", "mp3", "ac3", "eac3", "mp2"].includes(probe.audio.codec);
}

function isMp4Like(file) {
  return [".mp4", ".m4v", ".mov"].includes(path.extname(file).toLowerCase());
}

// ---------------------------------------------------------------------------
// process helpers
// ---------------------------------------------------------------------------

function runCapture(bin, args, timeoutMs = 30_000) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(bin, args, { windowsHide: true });
    } catch (error) {
      reject(error);
      return;
    }
    let stdout = "";
    let stderr = "";
    const timer = timeoutMs > 0 ? setTimeout(() => {
      try { child.kill(); } catch {}
      reject(new Error(`命令超时：${path.basename(bin)}`));
    }, timeoutMs) : null;
    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("error", (error) => { if (timer) clearTimeout(timer); reject(error); });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr, code });
      else reject(new Error(`${path.basename(bin)} 退出码 ${code}: ${stderr.slice(-1200)}`));
    });
  });
}

function mapLimit(items, limit, fn) {
  return new Promise((resolve) => {
    const results = new Array(items.length);
    let next = 0;
    let active = 0;
    let done = 0;
    if (items.length === 0) return resolve(results);
    const launch = () => {
      while (active < limit && next < items.length) {
        const i = next++;
        active++;
        Promise.resolve()
          .then(() => fn(items[i], i))
          .then((v) => { results[i] = v; })
          .catch((error) => { results[i] = { error }; })
          .finally(() => {
            active--;
            done++;
            if (done === items.length) resolve(results);
            else launch();
          });
      }
    };
    launch();
  });
}

function escapeConcatPath(file) {
  const posix = file.replace(/\\/g, "/");
  return posix.replace(/'/g, "'\\''");
}

async function writeConcatList(files, listPath) {
  const lines = ["ffconcat version 1.0"];
  for (const file of files) lines.push(`file '${escapeConcatPath(file)}'`);
  await fsp.mkdir(path.dirname(listPath), { recursive: true });
  await fsp.writeFile(listPath, lines.join("\n") + "\n", "utf8");
}

async function uniqueOutput(dir, base, ext) {
  let candidate = path.join(dir, `${base}_merged${ext}`);
  let i = 2;
  while (existingFile(candidate)) {
    candidate = path.join(dir, `${base}_merged (${i})${ext}`);
    i++;
  }
  return candidate;
}

function chooseCopyExt(files, videoCodec) {
  const exts = new Set(files.map((f) => path.extname(f.file || f.path).toLowerCase()));
  if (exts.size === 1) {
    const ext = [...exts][0];
    if ([".mp4", ".mkv", ".mov", ".webm"].includes(ext)) return ext;
    if (ext === ".m4v") return ".mp4";
  }
  if (["h264", "hevc", "av1", "mpeg4", "mpeg2video"].includes(videoCodec)) return ".mp4";
  if (["vp8", "vp9"].includes(videoCodec)) return ".webm";
  return ".mkv";
}

function even(n) {
  return Math.max(2, n - (n % 2));
}

function fmtDuration(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return "0s";
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m${String(s % 60).padStart(2, "0")}s`;
  return `${s}s`;
}

// ---------------------------------------------------------------------------
// merge runner
// ---------------------------------------------------------------------------

export class MergeRunner {
  constructor({ getFfmpeg, log = () => {} } = {}) {
    this.getFfmpeg = getFfmpeg;
    this.log = log;
    this.state = null;
    this.child = null;
    this.cancelled = false;
    this._resolveDone = null;
    this.done = Promise.resolve();
  }

  get running() {
    return Boolean(this.state && (this.state.status === "running" || this.state.status === "cancelling"));
  }

  snapshot() {
    return this.state ? JSON.parse(JSON.stringify(this.state)) : null;
  }

  cancel() {
    if (!this.running) return false;
    this.cancelled = true;
    this.state.status = "cancelling";
    if (this.state.currentFolder) {
      const f = this.state.folders.find((x) => x.path === this.state.currentFolder);
      if (f && f.status === "merging") f.message = "正在取消…";
    }
    if (this.child && this.child.pid) {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(this.child.pid), "/T", "/F"], { windowsHide: true }).on("error", () => {});
      } else {
        try { this.child.kill("SIGTERM"); } catch {}
      }
    }
    return true;
  }

  start({ root, folders, options = {} }) {
    if (this.running) throw new Error("已有合并任务正在运行");
    this.cancelled = false;
    const now = Date.now();
    this.state = {
      id: `job-${now.toString(36)}`,
      root,
      status: "running",
      startedAt: now,
      finishedAt: null,
      options: {
        recursive: options.recursive !== false,
        order: options.order === "mtime" ? "mtime" : "name",
        overwrite: Boolean(options.overwrite),
        reencodeFallback: options.reencodeFallback !== false,
        deleteSource: Boolean(options.deleteSource),
        outputDir: options.outputDir ? path.resolve(String(options.outputDir)) : "",
      },
      totalFolders: folders.length,
      completedFolders: 0,
      currentFolder: null,
      folders: folders.map((folder, index) => ({
        index,
        id: folder.id || folder.rel || String(index),
        path: folder.path,
        name: folder.name || path.basename(folder.path),
        count: folder.videos ? folder.videos.length : folder.count || 0,
        totalBytes: folder.videos ? folder.videos.reduce((n, v) => n + v.size, 0) : folder.totalSize || 0,
        status: "pending",
        message: "",
        progress: 0,
        current: "",
        output: "",
        outputSize: 0,
        durationSec: 0,
        speed: "",
        etaSec: null,
        warnings: [],
        deleted: 0,
        startedAt: null,
        finishedAt: null,
      })),
      summary: null,
    };
    this.done = new Promise((resolve) => { this._resolveDone = resolve; });
    this._run().catch((error) => {
      this.log(`[video-merger] job crashed: ${error && error.stack ? error.stack : error}`);
      if (this.state) {
        this.state.status = "failed";
        this.state.error = String(error && error.message ? error.message : error);
        this.state.finishedAt = Date.now();
      }
    }).finally(() => {
      if (this.state && (this.state.status === "running" || this.state.status === "cancelling")) {
        this.state.status = this.cancelled ? "cancelled" : "done";
        this.state.finishedAt = Date.now();
      }
      this._computeSummary();
      if (this._resolveDone) this._resolveDone(this.snapshot());
    });
    return this.state;
  }

  _computeSummary() {
    if (!this.state) return;
    const counts = { done: 0, skipped: 0, error: 0, cancelled: 0, pending: 0 };
    let bytes = 0;
    for (const folder of this.state.folders) {
      counts[folder.status] = (counts[folder.status] || 0) + 1;
      if (folder.status === "done") bytes += folder.outputSize || 0;
    }
    this.state.summary = {
      ...counts,
      total: this.state.folders.length,
      outputBytes: bytes,
    };
  }

  _setOverall() {
    if (!this.state) return;
    const total = this.state.folders.length || 1;
    const completed = this.state.folders.filter((f) => ["done", "skipped", "error", "cancelled"].includes(f.status)).length;
    const current = this.state.folders.find((f) => f.status === "merging" || f.status === "probing");
    const partial = current ? (current.progress || 0) / 100 : 0;
    this.state.overallProgress = Math.min(100, Math.round(((completed + partial) / total) * 100));
  }

  async _run() {
    const ff = await this.getFfmpeg();
    if (!ff || !ff.available) throw new Error("未找到 ffmpeg / ffprobe，请先安装或指定 ffmpeg 目录");
    this.ff = ff;
    if (this.state.options.outputDir) {
      await fsp.mkdir(this.state.options.outputDir, { recursive: true });
    }

    for (const folderState of this.state.folders) {
      if (this.cancelled) {
        folderState.status = "cancelled";
        folderState.message = "任务已取消";
        continue;
      }
      this.state.currentFolder = folderState.path;
      folderState.status = "probing";
      folderState.startedAt = Date.now();
      folderState.message = "正在分析视频…";
      this._setOverall();
      try {
        await this._mergeOne(folderState);
      } catch (error) {
        if (this.cancelled) {
          folderState.status = "cancelled";
          folderState.message = "任务已取消";
        } else {
          folderState.status = "error";
          folderState.message = String(error && error.message ? error.message : error).slice(0, 800);
          this.log(`[video-merger] folder failed: ${folderState.path}: ${folderState.message}`);
        }
      } finally {
        folderState.finishedAt = Date.now();
        folderState.current = "";
        folderState.speed = "";
        folderState.progress = folderState.status === "done" ? 100 : folderState.progress;
        this.state.completedFolders += 1;
        this.state.currentFolder = null;
        this._setOverall();
      }
    }
  }

  async _mergeOne(folder) {
    const files = await scanFolder(folder.path).catch(() => []);
    if (files.length === 0) {
      folder.status = "skipped";
      folder.message = "文件夹里没有视频";
      return;
    }
    if (files.length < 2) {
      folder.status = "skipped";
      folder.message = "只有一个视频，无需合并";
      return;
    }
    folder.count = files.length;
    folder.totalBytes = files.reduce((n, v) => n + v.size, 0);

    const probes = await mapLimit(files, 4, async (file) => {
      try {
        return await probeMedia(this.ff.ffprobe, file.path);
      } catch (error) {
        return { error: String(error && error.message ? error.message : error), file };
      }
    });
    const valid = probes.filter((p) => p && !p.error && p.video && p.video.width > 0);
    const invalid = probes.filter((p) => p && p.error);
    if (valid.length < 2) {
      folder.status = "skipped";
      folder.message = `可用视频不足 2 个（${valid.length}/${files.length} 个可解析）`;
      return;
    }
    if (invalid.length) folder.warnings.push(`${invalid.length} 个文件无法解析，已跳过：${invalid.slice(0, 3).map((p) => path.basename(p.file.path)).join("、")}`);

    const target = valid[0];
    folder.durationSec = valid.reduce((n, p) => n + (p.duration || 0), 0);
    const targetAudio = target.audio || valid.find((p) => p.audio)?.audio || null;
    const targetVideoSig = videoRemuxSig(target.video);
    const targetAudioSig = audioCopySig(targetAudio);
    const videoCopySafe = valid.every((p) => videoRemuxSig(p.video) === targetVideoSig
      && nearZero(p.video.startTime) && !isVfr(p.video));
    const sameAudio = valid.every((p) => audioCopySig(p.audio) === targetAudioSig);
    const sameTimeBase = valid.every((p) => p.video.timeBase === target.video.timeBase);
    const startsAtZero = valid.every((p) => nearZero(p.formatStart));
    const tsFriendly = valid.every(isTsFriendly);
    const copySafe = videoCopySafe && sameAudio && sameTimeBase && startsAtZero;
    const audioOnly = videoCopySafe && !sameAudio && tsFriendly && !valid.some((p) => isVfr(p.video));
    const remuxable = tsFriendly && sameTimeBase
      && valid.every((p) => remuxSig(p) === remuxSig(target))
      && !valid.some((p) => isVfr(p.video));

    let mode = "encode";
    let reason = "流参数不一致，需要转码";
    if (copySafe) {
      mode = "copy";
      reason = "流参数完全一致，无损拼接";
    } else if (audioOnly) {
      mode = "audiofix";
      reason = "视频一致、音频参数不同，仅转音频";
    } else if (remuxable) {
      mode = "remux";
      reason = "流参数一致、容器/时间戳不同，重封装";
    }

    if (mode === "encode" && !this.state.options.reencodeFallback) {
      folder.status = "skipped";
      folder.message = "视频规格不一致，且未开启“转码对齐”";
      return;
    }

    folder.mode = mode;
    folder.reason = reason;
    const ext = mode === "copy" ? chooseCopyExt(valid, target.video.codec) : ".mp4";
    const outDir = this.state.options.outputDir || folder.path;
    let base = folder.name || path.basename(folder.path);
    if (this.state.options.outputDir) {
      const rel = path.relative(this.state.root, folder.path);
      if (rel && rel !== "." && !rel.startsWith("..") && !path.isAbsolute(rel)) {
        base = rel.split(/[\\/]+/).join("_");
      }
      base = base.replace(/[<>:"|?*\x00-\x1f]/g, "_") || "merged";
    }
    const output = this.state.options.overwrite
      ? path.join(outDir, `${base}_merged${ext}`)
      : await uniqueOutput(outDir, base, ext);
    folder.output = output;
    folder.status = "merging";
    folder.message = {
      copy: "无损合并中（不重新编码）…",
      audiofix: "视频直接复制，正在修正音频…",
      remux: "正在重封装（不重新编码）…",
      encode: "正在单遍转码合并…",
    }[mode] || "正在合并…";
    this._setOverall();

    const tempDir = path.join(os.tmpdir(), "dsh-video-merger", this.state.id, String(folder.index));
    await fsp.mkdir(tempDir, { recursive: true });
    try {
      const listPath = path.join(tempDir, "concat.txt");
      if (mode !== "encode") await writeConcatList(valid.map((p) => p.file), listPath);

      if (mode === "copy") {
        let copyError = null;
        let result = null;
        try {
          result = await this._runCopy(listPath, output, folder, folder.durationSec);
        } catch (error) {
          copyError = error;
        }
        if (copyError || this._hasTimestampWarning(result?.stderr)) {
          folder.warnings.push(copyError
            ? "直接拼接失败，已自动改为重封装"
            : "直接拼接出现时间戳警告，已自动改为重封装");
          folder.message = "检测到接缝异常，正在重封装…";
          this.log(`[video-merger] copy fallback to remux: ${folder.path}: ${copyError?.message || "timestamp warning"}`);
          await this._runRemux(valid, output, folder, folder.durationSec, targetAudio, tempDir);
          folder.mode = "remux";
        }
      } else if (mode === "audiofix") {
        await this._runAudioFix(listPath, output, folder, folder.durationSec, targetAudio);
      } else if (mode === "remux") {
        await this._runRemux(valid, output, folder, folder.durationSec, targetAudio, tempDir);
      } else {
        await this._runEncode(valid, target, targetAudio, output, folder, tempDir);
      }

      const st = await fsp.stat(output).catch(() => null);
      if (!st || st.size < 1024) throw new Error("输出文件为空或生成失败");
      folder.outputSize = st.size;
      folder.status = "done";
      folder.progress = 100;
      folder.message = {
        copy: "合并完成（原规格无损）",
        audiofix: "合并完成（视频无损，音频已修正）",
        remux: "合并完成（已重封装）",
        encode: `合并完成（${folder.encoder || "已转码"}）`,
      }[folder.mode] || "合并完成";
      if (this.state.options.deleteSource) {
        for (const p of valid) {
          try {
            await fsp.unlink(p.file);
            folder.deleted += 1;
          } catch (error) {
            folder.warnings.push(`删除失败：${path.basename(p.file)}`);
          }
        }
      }
    } finally {
      await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  _progressHandler(folder, totalDuration, from, span) {
    return ({ us, speed }) => {
      if (!totalDuration || totalDuration <= 0) return;
      const seconds = us / 1e6;
      const pct = Math.max(0, Math.min(1, seconds / totalDuration));
      folder.progress = Math.min(99, Math.round(from + pct * span));
      folder.speed = speed || "";
      const remain = Math.max(0, totalDuration - seconds);
      const rate = Number(String(speed || "").replace("x", ""));
      folder.etaSec = Number.isFinite(rate) && rate > 0 ? Math.round(remain / rate) : null;
      this._setOverall();
    };
  }

  async _runCopy(listPath, output, folder, totalDuration) {
    const args = [
      "-hide_banner", "-loglevel", "warning", "-nostats", "-progress", "pipe:1",
      "-f", "concat", "-safe", "0", "-i", listPath,
      "-map", "0:v:0", "-map", "0:a?", "-c", "copy",
    ];
    args.push("-y", output);
    return this._spawnFfmpeg(args, this._progressHandler(folder, totalDuration, 2, 96));
  }

  _hasTimestampWarning(text) {
    const lines = String(text || "").split(/\r?\n/);
    return lines.some((line) => {
      if (!/Non-monotonous|Non-monotonic|invalid DTS|DTS .* out of order|Application provided invalid/i.test(line)) return false;
      // Video-stream warnings can create visible seams; audio-only DTS nudges
      // (usually AAC priming) are harmless and must not force a remux.
      return /output stream 0:0|video/i.test(line);
    });
  }

  async _runRemux(probes, output, folder, totalDuration, targetAudio, tempDir) {
    const segments = [];
    let elapsed = 0;
    for (let i = 0; i < probes.length; i++) {
      if (this.cancelled) throw new Error("任务已取消");
      const p = probes[i];
      const seg = path.join(tempDir, `seg_${String(i + 1).padStart(4, "0")}.ts`);
      folder.message = `重封装 ${i + 1}/${probes.length}：${path.basename(p.file)}`;
      const before = elapsed;
      await this._spawnFfmpeg([
        "-hide_banner", "-loglevel", "error", "-nostats", "-progress", "pipe:1",
        "-y", "-i", p.file, "-map", "0:v:0", "-map", "0:a?", "-c", "copy", "-f", "mpegts", seg,
      ], ({ us, speed }) => {
        const sec = us / 1e6;
        const pct = p.duration > 0 ? Math.min(1, sec / p.duration) : 0;
        folder.progress = Math.min(82, Math.round(((before + pct * (p.duration || 0)) / totalDuration) * 80));
        folder.speed = speed || "";
        this._setOverall();
      });
      segments.push(seg);
      elapsed += p.duration || 0;
    }

    const listPath = path.join(tempDir, "remux.txt");
    await writeConcatList(segments, listPath);
    folder.message = "正在封装最终文件…";
    const args = [
      "-hide_banner", "-loglevel", "error", "-nostats", "-progress", "pipe:1",
      "-f", "concat", "-safe", "0", "-i", listPath,
      "-map", "0:v:0", "-map", "0:a?", "-c", "copy",
    ];
    if (isMp4Like(output)) {
      if (targetAudio?.codec === "aac") args.push("-bsf:a", "aac_adtstoasc");
      args.push("-video_track_timescale", "30000", "-movflags", "+faststart");
    }
    args.push("-y", output);
    return this._spawnFfmpeg(args, this._progressHandler(folder, totalDuration, 84, 14));
  }

  async _runAudioFix(listPath, output, folder, totalDuration, targetAudio) {
    const sampleRate = targetAudio?.sampleRate || 48000;
    const channels = Math.max(1, Math.min(2, targetAudio?.channels || 2));
    const layout = channels === 1 ? "mono" : "stereo";
    const args = [
      "-hide_banner", "-loglevel", "error", "-nostats", "-progress", "pipe:1",
      "-f", "concat", "-safe", "0", "-i", listPath,
      "-f", "lavfi", "-t", String(Math.max(0.1, totalDuration)), "-i", `anullsrc=r=${sampleRate}:cl=${layout}`,
      "-map", "0:v:0", "-map", "1:a:0",
      "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
      "-ar", String(sampleRate), "-ac", String(channels),
      "-shortest", "-movflags", "+faststart", "-y", output,
    ];
    return this._spawnFfmpeg(args, this._progressHandler(folder, totalDuration, 2, 96));
  }

  async _runEncode(probes, target, targetAudio, output, folder, tempDir) {
    if (probes.length > 32) {
      folder.message = "视频数量较多，分批转码后拼接…";
      return this._runNormalize(probes, target, targetAudio, output, folder, tempDir);
    }
    const v = target.video;
    const width = even(v.width);
    const height = even(v.height);
    const fps = v.fps && v.fps !== "0/0" ? v.fps : "30";
    const sampleRate = targetAudio?.sampleRate || 48000;
    const channels = Math.max(1, Math.min(2, targetAudio?.channels || 2));
    const layout = channels === 1 ? "mono" : "stereo";
    const encoder = await resolveEncoder(this.ff.ffmpeg, v.codec === "hevc" ? "hevc" : "h264");
    folder.encoder = encoder.label;

    const args = ["-hide_banner", "-loglevel", "error", "-nostats", "-progress", "pipe:1", "-y"];
    const filter = [];
    const concatInputs = [];
    const totalDuration = probes.reduce((n, p) => n + (p.duration || 0), 0) || 1;
    let inputIndex = 0;

    for (let i = 0; i < probes.length; i++) {
      const p = probes[i];
      const dur = Math.max(0.04, p.duration || 0);
      args.push("-i", p.file);
      const videoInput = inputIndex++;
      filter.push(`[${videoInput}:v:0]trim=duration=${dur},setpts=PTS-STARTPTS,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps},format=yuv420p[v${i}]`);
      concatInputs.push(`[v${i}]`);
      if (targetAudio) {
        if (p.audio) {
          filter.push(`[${videoInput}:a:0]aresample=${sampleRate},aformat=sample_fmts=fltp:channel_layouts=${layout},apad,atrim=duration=${dur},asetpts=PTS-STARTPTS[a${i}]`);
        } else {
          const silenceIndex = inputIndex++;
          args.push("-f", "lavfi", "-t", String(dur), "-i", `anullsrc=r=${sampleRate}:cl=${layout}`);
          filter.push(`[${silenceIndex}:a:0]aformat=sample_fmts=fltp:channel_layouts=${layout},apad,atrim=duration=${dur},asetpts=PTS-STARTPTS[a${i}]`);
        }
        concatInputs.push(`[a${i}]`);
      }
    }

    if (targetAudio) {
      filter.push(`${concatInputs.join("")}concat=n=${probes.length}:v=1:a=1[v][a]`);
      args.push("-filter_complex", filter.join(";"), "-map", "[v]", "-map", "[a]");
      args.push("-c:a", "aac", "-b:a", "192k", "-ar", String(sampleRate), "-ac", String(channels));
    } else {
      filter.push(`${concatInputs.join("")}concat=n=${probes.length}:v=1:a=0[v]`);
      args.push("-filter_complex", filter.join(";"), "-map", "[v]", "-an");
    }

    args.push("-c:v", encoder.name, ...encoder.args, "-pix_fmt", "yuv420p");
    args.push("-movflags", "+faststart", output);
    return this._spawnFfmpeg(args, this._progressHandler(folder, totalDuration, 2, 96));
  }

  async _runNormalize(probes, target, targetAudio, output, folder, tempDir) {
    const v = target.video;
    const width = even(v.width);
    const height = even(v.height);
    const fps = v.fps && v.fps !== "0/0" ? v.fps : "30";
    const sampleRate = targetAudio?.sampleRate || 48000;
    const channels = Math.max(1, Math.min(2, targetAudio?.channels || 2));
    const layout = channels === 1 ? "mono" : "stereo";
    const wanted = `${videoSig(target.video)}#${audioSig(targetAudio)}`;
    const normalized = [];

    const totalDuration = probes.reduce((n, p) => n + (p.duration || 0), 0) || 1;
    let elapsedBefore = 0;

    for (let i = 0; i < probes.length; i++) {
      if (this.cancelled) throw new Error("任务已取消");
      const p = probes[i];
      folder.current = path.basename(p.file);
      folder.message = `转码 ${i + 1}/${probes.length}：${path.basename(p.file)}`;
      if (streamShape(p) === wanted) {
        normalized.push(p.file);
        elapsedBefore += p.duration || 0;
        folder.progress = Math.round(((elapsedBefore / totalDuration) * 82));
        this._setOverall();
        continue;
      }
      const out = path.join(tempDir, `norm_${String(i + 1).padStart(4, "0")}.mp4`);
      const args = ["-hide_banner", "-loglevel", "error", "-nostats", "-progress", "pipe:1", "-y", "-i", p.file];
      const hasAudio = Boolean(p.audio);
      let audioInput = -1;
      if (targetAudio) {
        if (hasAudio) {
          audioInput = 0;
        } else {
          const dur = p.duration > 0 ? p.duration : 1;
          args.push("-f", "lavfi", "-t", String(dur), "-i", `anullsrc=r=${sampleRate}:cl=${layout}`);
          audioInput = 1;
        }
      }
      const filter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps},format=yuv420p`;
      args.push("-vf", filter, "-map", "0:v:0");
      if (targetAudio && audioInput >= 0) args.push("-map", `${audioInput}:a:0`);
      args.push("-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p");
      if (targetAudio && audioInput >= 0) {
        args.push("-c:a", "aac", "-b:a", "192k", "-ar", String(sampleRate), "-ac", String(channels));
        if (!hasAudio) args.push("-shortest");
      } else {
        args.push("-an");
      }
      args.push("-movflags", "+faststart", out);

      const before = elapsedBefore;
      await this._spawnFfmpeg(args, ({ us, speed }) => {
        const sec = us / 1e6;
        const pct = p.duration > 0 ? Math.min(1, sec / p.duration) : 0;
        folder.progress = Math.min(84, Math.round(((before + pct * (p.duration || 0)) / totalDuration) * 82));
        folder.speed = speed || "";
        this._setOverall();
      });
      normalized.push(out);
      elapsedBefore += p.duration || 0;
    }

    if (this.cancelled) throw new Error("任务已取消");
    folder.message = "正在封装最终文件…";
    folder.progress = 86;
    this._setOverall();
    const listPath = path.join(tempDir, "concat.txt");
    await writeConcatList(normalized, listPath);
    const args = [
      "-hide_banner", "-loglevel", "error", "-nostats", "-progress", "pipe:1",
      "-f", "concat", "-safe", "0", "-i", listPath,
      "-map", "0:v:0", "-map", "0:a?", "-c", "copy",
      "-fflags", "+genpts", "-avoid_negative_ts", "make_zero",
      "-movflags", "+faststart", "-y", output,
    ];
    await this._spawnFfmpeg(args, this._progressHandler(folder, totalDuration, 86, 13));
  }

  _spawnFfmpeg(args, onProgress) {
    return new Promise((resolve, reject) => {
      const child = spawn(this.ff.ffmpeg, args, { windowsHide: true });
      this.child = child;
      this._lastUs = 0;
      this._lastSpeed = "";
      let stderr = "";
      let stdoutBuf = "";
      const timer = setTimeout(() => {
        try {
          if (process.platform === "win32") spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true });
          else child.kill("SIGTERM");
        } catch {}
        reject(new Error("ffmpeg 运行超时（6 小时）"));
      }, 6 * 60 * 60 * 1000);
      child.stdout.on("data", (data) => {
        stdoutBuf += data.toString();
        let idx;
        while ((idx = stdoutBuf.indexOf("\n")) >= 0) {
          const line = stdoutBuf.slice(0, idx).trim();
          stdoutBuf = stdoutBuf.slice(idx + 1);
          if (!line.includes("=")) continue;
          const eq = line.indexOf("=");
          const key = line.slice(0, eq);
          const value = line.slice(eq + 1);
          if (key === "out_time_us" || key === "out_time_ms") {
            const us = Number(value);
            if (Number.isFinite(us) && us >= 0) {
              this._lastUs = us;
              if (onProgress) onProgress({ us, speed: this._lastSpeed });
            }
          } else if (key === "speed") {
            this._lastSpeed = value;
            if (onProgress) onProgress({ us: this._lastUs || 0, speed: value });
          }
        }
      });
      child.stderr.on("data", (data) => {
        stderr = (stderr + data.toString()).slice(-12_000);
      });
      child.on("error", (error) => {
        clearTimeout(timer);
        this.child = null;
        reject(error);
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        this.child = null;
        if (this.cancelled) return reject(new Error("任务已取消"));
        if (code === 0) return resolve({ stderr });
        const tail = stderr.trim().split(/\r?\n/).slice(-8).join(" | ");
        reject(new Error(`ffmpeg 失败（退出码 ${code}）：${tail || "未知错误"}`));
      });
    });
  }
}

// ---------------------------------------------------------------------------
// ffmpeg downloader
// ---------------------------------------------------------------------------

function httpsGet(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 dsh-video-merger",
        "Accept": "application/octet-stream,*/*",
      },
      timeout: 60_000,
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 6) {
        res.resume();
        resolve(httpsGet(new URL(res.headers.location, url).toString(), redirects + 1));
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`下载失败：HTTP ${res.statusCode}`));
        return;
      }
      resolve(res);
    });
    req.on("timeout", () => req.destroy(new Error("下载超时")));
    req.on("error", reject);
  });
}

async function findFileRecursive(dir, names, depth = 0) {
  if (depth > 6) return [];
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const found = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && names.includes(entry.name.toLowerCase())) found.push(full);
    else if (entry.isDirectory()) found.push(...await findFileRecursive(full, names, depth + 1));
  }
  return found;
}

export class FfmpegInstaller {
  constructor({ config, onDone } = {}) {
    this.config = config;
    this.onDone = onDone;
    this.state = { status: "idle", percent: 0, received: 0, total: 0, error: "", startedAt: null, finishedAt: null };
  }

  snapshot() {
    return { ...this.state };
  }

  get running() {
    return this.state.status === "downloading" || this.state.status === "extracting" || this.state.status === "verifying";
  }

  start() {
    if (this.running) throw new Error("正在安装 ffmpeg");
    this.state = { status: "downloading", percent: 0, received: 0, total: 0, error: "", startedAt: Date.now(), finishedAt: null };
    this._run().catch((error) => {
      this.state.status = "error";
      this.state.error = String(error && error.message ? error.message : error);
      this.state.finishedAt = Date.now();
    });
    return this.snapshot();
  }

  async _run() {
    const cfg = this.config || (await loadConfig());
    const url = cfg.downloadUrl;
    const dir = path.join(dataDir(), "download");
    const extractDir = path.join(dataDir(), "extract");
    await fsp.mkdir(dir, { recursive: true });
    await fsp.rm(extractDir, { recursive: true, force: true });
    await fsp.mkdir(extractDir, { recursive: true });
    const zipPath = path.join(dir, "ffmpeg.zip");

    const res = await httpsGet(url);
    const total = Number(res.headers["content-length"]) || 0;
    this.state.total = total;
    const out = fs.createWriteStream(zipPath);
    await new Promise((resolve, reject) => {
      let received = 0;
      res.on("data", (chunk) => {
        received += chunk.length;
        this.state.received = received;
        if (total > 0) this.state.percent = Math.min(80, Math.round((received / total) * 80));
      });
      res.on("error", reject);
      out.on("error", reject);
      out.on("finish", resolve);
      res.pipe(out);
    });

    this.state.status = "extracting";
    this.state.percent = 82;
    await fsp.rm(extractDir, { recursive: true, force: true });
    await fsp.mkdir(extractDir, { recursive: true });
    try {
      await runCapture("tar", ["-xf", zipPath, "-C", extractDir], 10 * 60_000);
    } catch (error) {
      await runCapture("powershell", ["-NoProfile", "-NonInteractive", "-Command", `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force`], 10 * 60_000);
    }

    this.state.status = "verifying";
    this.state.percent = 88;
    const names = exeNames();
    const wanted = [names.ffmpeg.toLowerCase(), names.ffprobe.toLowerCase()];
    const found = await findFileRecursive(extractDir, wanted);
    const ffmpeg = found.find((p) => path.basename(p).toLowerCase() === names.ffmpeg.toLowerCase());
    const ffprobe = found.find((p) => path.basename(p).toLowerCase() === names.ffprobe.toLowerCase());
    if (!ffmpeg || !ffprobe) throw new Error("压缩包里没有找到 ffmpeg/ffprobe");

    const binDir = path.join(dataDir(), "bin");
    await fsp.mkdir(binDir, { recursive: true });
    const ffmpegDest = path.join(binDir, names.ffmpeg);
    const ffprobeDest = path.join(binDir, names.ffprobe);
    await fsp.copyFile(ffmpeg, ffmpegDest);
    await fsp.copyFile(ffprobe, ffprobeDest);
    if (process.platform !== "win32") {
      await fsp.chmod(ffmpegDest, 0o755);
      await fsp.chmod(ffprobeDest, 0o755);
    }

    const version = await readFfmpegVersion(ffmpegDest);
    if (!version) throw new Error("下载的 ffmpeg 无法运行");
    await saveConfig({ ffmpegDir: binDir });
    invalidateFfmpegCache();
    this.state.percent = 100;
    this.state.status = "done";
    this.state.version = version;
    this.state.ffmpegDir = binDir;
    this.state.finishedAt = Date.now();
    await fsp.rm(zipPath, { force: true }).catch(() => {});
    if (this.onDone) this.onDone();
  }
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = n / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
}

export { fmtDuration };
