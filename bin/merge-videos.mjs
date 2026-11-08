#!/usr/bin/env node
/**
 * Standalone CLI for dsh-video-merger.
 *
 * Usage:
 *   node bin/merge-videos.mjs "E:\videos" [options]
 *
 * Options:
 *   --no-recursive        scan only the root folder
 *   --folder <path>       merge only this folder
 *   --order name|mtime    clip order (default name)
 *   --overwrite           overwrite existing *_merged output
 *   --no-reencode         skip folders whose clips have mismatched specs
 *   --delete-source       delete source clips after a successful merge
 *   --out <dir>           put every merged video in this folder (created if missing)
 *   --ffmpeg <dir>        directory containing ffmpeg.exe / ffprobe.exe
 *   --json                print the final job snapshot as JSON
 */
import path from "node:path";
import { loadConfig, resolveFfmpeg, scanRoot, MergeRunner, formatBytes } from "../lib/engine.js";

function parseArgs(argv) {
  const opts = {
    root: null, folder: null, recursive: true, order: "name",
    overwrite: false, reencodeFallback: true, deleteSource: false,
    outputDir: null, ffmpegDir: null, json: false,
  };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--no-recursive") opts.recursive = false;
    else if (a === "--overwrite") opts.overwrite = true;
    else if (a === "--no-reencode") opts.reencodeFallback = false;
    else if (a === "--delete-source") opts.deleteSource = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--folder") opts.folder = argv[++i];
    else if (a === "--out") opts.outputDir = argv[++i];
    else if (a === "--order") opts.order = argv[++i] === "mtime" ? "mtime" : "name";
    else if (a === "--ffmpeg") opts.ffmpegDir = argv[++i];
    else if (a === "--help" || a === "-h") opts.help = true;
    else if (a.startsWith("--")) throw new Error(`未知参数: ${a}`);
    else rest.push(a);
  }
  opts.root = opts.folder || rest[0] || null;
  return opts;
}

function usage() {
  console.log("用法: node bin/merge-videos.mjs <根目录> [--no-recursive] [--folder <目录>] [--order name|mtime]");
  console.log("       [--overwrite] [--no-reencode] [--delete-source] [--out <目录>] [--ffmpeg <目录>] [--json]");
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help || !opts.root) {
  usage();
  process.exit(opts.help ? 0 : 2);
}

const root = path.resolve(opts.root);
const config = await loadConfig();
if (opts.ffmpegDir) config.ffmpegDir = path.resolve(opts.ffmpegDir);
const ff = await resolveFfmpeg({ config, refresh: true });
if (!ff.available) {
  console.error("未找到 ffmpeg / ffprobe。请安装 ffmpeg，或用 --ffmpeg <目录> 指定。");
  process.exit(3);
}
console.log(`ffmpeg: ${ff.ffmpeg}`);
console.log(`扫描: ${root}`);

const folders = opts.folder
  ? [{ path: root, name: path.basename(root), videos: (await scanRoot(root, { recursive: false, order: opts.order }))[0]?.videos || [] }]
  : await scanRoot(root, { recursive: opts.recursive, order: opts.order });

const targets = folders.filter((f) => f.videos.length >= 2);
if (!targets.length) {
  console.log("没有找到包含至少 2 个视频的文件夹。");
  process.exit(0);
}
console.log(`发现 ${targets.length} 个文件夹，共 ${targets.reduce((n, f) => n + f.videos.length, 0)} 个视频。\n`);

const runner = new MergeRunner({
  getFfmpeg: async () => ff,
  log: (line) => console.error(line),
});
runner.start({
  root,
  folders: targets,
  options: {
    recursive: opts.recursive,
    order: opts.order,
    overwrite: opts.overwrite,
    reencodeFallback: opts.reencodeFallback,
    deleteSource: opts.deleteSource,
    outputDir: opts.outputDir ? path.resolve(opts.outputDir) : "",
  },
});

let lastLine = "";
const timer = setInterval(() => {
  const s = runner.snapshot();
  if (!s) return;
  const current = s.folders.find((f) => f.status === "merging" || f.status === "probing");
  const line = `总进度 ${String(s.overallProgress || 0).padStart(3)}%  ` +
    (current ? `${current.name}: ${current.progress || 0}% ${current.speed || ""}` : "…");
  if (line !== lastLine) {
    lastLine = line;
    if (!opts.json) process.stdout.write(`\r${line}\x1b[K`);
  }
}, 400);
timer.unref?.();

const final = await runner.done;
clearInterval(timer);
if (!opts.json) process.stdout.write("\n");

if (opts.json) {
  console.log(JSON.stringify(final, null, 2));
} else {
  for (const f of final.folders) {
    const mark = f.status === "done" ? "✓" : f.status === "skipped" ? "-" : "✗";
    const extra = f.status === "done" ? `${formatBytes(f.outputSize)} -> ${f.output}` : f.message || "";
    console.log(`${mark} ${f.name}  ${extra}`);
  }
  const s = final.summary || {};
  console.log(`\n完成 ${s.done || 0} 个，跳过 ${s.skipped || 0} 个，失败 ${s.error || 0} 个；共输出 ${formatBytes(s.outputBytes || 0)}`);
}

process.exit(final.summary && final.summary.error ? 1 : 0);
