#!/usr/bin/env node
/**
 * End-to-end merge test.
 *
 *   node test/run.mjs                    # generate fixtures, merge into test/output
 *   node test/run.mjs --ffmpeg <dir>     # use a specific ffmpeg build
 *   node test/run.mjs <root> --out <dir> # merge an existing folder tree
 */
import assert from "node:assert/strict";
import fsp from "node:fs/promises";
import path from "node:path";
import {
  loadConfig, resolveFfmpeg, scanRoot, MergeRunner, probeMedia, formatBytes,
} from "../lib/engine.js";
import { FIXTURE_ROOT, TEST_DIR, makeFixtures } from "./fixtures.mjs";

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index > 0 ? process.argv[index + 1] : null;
}

const ffmpegArg = valueAfter("--ffmpeg");
const outputArg = valueAfter("--out");
const positional = process.argv.slice(2).find((arg) => !arg.startsWith("--") && arg !== ffmpegArg && arg !== outputArg);
const config = await loadConfig();
if (ffmpegArg) config.ffmpegDir = path.resolve(ffmpegArg);
const ff = await resolveFfmpeg({ config, refresh: true });
if (!ff.available) {
  console.error("未找到 ffmpeg / ffprobe。请安装 ffmpeg，或用 --ffmpeg <目录> 指定。");
  process.exit(3);
}

const root = path.resolve(positional || FIXTURE_ROOT);
if (root === path.resolve(FIXTURE_ROOT)) {
  const ready = await fsp.access(path.join(root, "setA", "01-first.mp4")).then(() => true, () => false);
  if (!ready) await makeFixtures(ff.ffmpeg);
}

const outputDir = outputArg ? path.resolve(outputArg) : path.join(TEST_DIR, "output");
if (!outputArg) await fsp.rm(outputDir, { recursive: true, force: true });
await fsp.mkdir(outputDir, { recursive: true });

console.log(`ffmpeg: ${ff.ffmpeg}`);
console.log(`scan:   ${root}`);
console.log(`output: ${outputDir}`);

const folders = await scanRoot(root, { recursive: true });
const targets = folders.filter((folder) => folder.count >= 2);
assert.ok(targets.length > 0, "no folder with at least two videos");
console.log(`folders: ${folders.length}, targets: ${targets.length}`);

const runner = new MergeRunner({ getFfmpeg: async () => ff, log: console.log });
runner.start({
  root,
  folders: targets,
  options: {
    overwrite: true,
    reencodeFallback: true,
    deleteSource: false,
    order: "name",
    outputDir,
  },
});

const final = await runner.done;
assert.equal(final.status, "done", `job finished with ${final.status}: ${final.error || ""}`);
assert.equal(final.folders.filter((folder) => folder.status === "done").length, targets.length);

let bytes = 0;
for (const folder of final.folders) {
  assert.equal(folder.status, "done", `${folder.name}: ${folder.status} ${folder.message || ""}`);
  assert.ok(folder.output, `${folder.name}: missing output path`);
  assert.equal(path.dirname(folder.output), outputDir, `${folder.name}: output escaped outputDir`);
  const exists = await fsp.access(folder.output).then(() => true, () => false);
  assert.ok(exists, `${folder.name}: output file does not exist`);
  bytes += folder.outputSize || 0;
}

const byName = new Map(final.folders.map((folder) => [folder.name, folder]));
const specs = {
  setA: { width: 320, height: 240, fps: "30/1", audio: true, ext: ".mp4" },
  setB: { width: 320, height: 240, fps: "30/1", audio: true, ext: ".mp4" },
  setC: { width: 320, height: 240, fps: "30/1", audio: true, ext: ".mkv" },
  setD: { width: 320, height: 240, fps: "30/1", audio: true, ext: ".mp4" },
  setE: { width: 320, height: 240, fps: "30/1", audio: true, ext: ".mp4" },
};

for (const [name, expected] of Object.entries(specs)) {
  const folder = byName.get(name);
  assert.ok(folder, `missing folder ${name}`);
  assert.equal(path.extname(folder.output), expected.ext, `${name}: wrong container`);
  const probe = await probeMedia(ff.ffprobe, folder.output);
  assert.equal(probe.video.width, expected.width, `${name}: width`);
  assert.equal(probe.video.height, expected.height, `${name}: height`);
  assert.equal(probe.video.fps, expected.fps, `${name}: fps`);
  assert.equal(Boolean(probe.audio), expected.audio, `${name}: audio stream`);
  assert.ok(Math.abs(probe.duration - 2) < 0.35, `${name}: duration ${probe.duration}`);
}

const single = folders.find((folder) => folder.name === "single");
assert.ok(single && single.count === 1);
assert.ok(!final.folders.some((folder) => folder.name === "single"), "single clip folder must be skipped");
const singleOutput = await fsp.access(path.join(outputDir, "single_merged.mp4")).then(() => true, () => false);
assert.equal(singleOutput, false, "single clip folder must not produce output");

console.log("");
for (const folder of final.folders) {
  console.log(`✓ ${folder.name.padEnd(6)} ${formatBytes(folder.outputSize)}  ${path.basename(folder.output)}`);
}
console.log(`\nall merge tests passed: ${final.folders.length} folders, ${formatBytes(bytes)}`);
