import { spawnSync } from "node:child_process";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURE_ROOT = path.join(TEST_DIR, "fixtures");

function run(ffmpeg, args) {
  const result = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed (${result.status}):\n${result.stderr || result.stdout || ""}`);
  }
}

function clip(ffmpeg, file, { width, height, fps, seconds, audio, ext }) {
  const args = [
    "-f", "lavfi", "-i", `testsrc2=size=${width}x${height}:rate=${fps}:duration=${seconds}`,
  ];
  if (audio) {
    args.push("-f", "lavfi", "-i", `sine=frequency=440:sample_rate=48000:duration=${seconds}`);
    args.push("-c:a", "aac", "-b:a", "96k");
  }
  args.push("-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p");
  if (audio) args.push("-shortest");
  args.push("-t", String(seconds), file);
  run(ffmpeg, args);
}

/**
 * Build small, deterministic test clips:
 * - setA: two identical clips        -> lossless concat
 * - setB: 320x240 + 480x360/24fps    -> transcode fallback
 * - setC: two Matroska clips         -> keep the .mkv container
 * - setD: a file name with an quote   -> concat list escaping
 * - setE: one with audio, one silent  -> borrowed audio + silence padding
 * - single: one clip                  -> must be skipped
 */
export async function makeFixtures(ffmpeg) {
  await fsp.rm(FIXTURE_ROOT, { recursive: true, force: true });

  const dirs = Object.fromEntries(
    ["setA", "setB", "setC", "setD", "setE", "single"].map((name) => [name, path.join(FIXTURE_ROOT, name)]),
  );
  await Promise.all(Object.values(dirs).map((dir) => fsp.mkdir(dir, { recursive: true })));

  const common = { width: 320, height: 240, fps: 30, seconds: 1, audio: true, ext: "mp4" };
  clip(ffmpeg, path.join(dirs.setA, "01-first.mp4"), common);
  clip(ffmpeg, path.join(dirs.setA, "02-second.mp4"), common);

  clip(ffmpeg, path.join(dirs.setB, "01-small.mp4"), common);
  clip(ffmpeg, path.join(dirs.setB, "02-large.mp4"), {
    ...common, width: 480, height: 360, fps: 24,
  });

  clip(ffmpeg, path.join(dirs.setC, "01-first.mkv"), { ...common, ext: "mkv" });
  clip(ffmpeg, path.join(dirs.setC, "02-second.mkv"), { ...common, ext: "mkv" });

  clip(ffmpeg, path.join(dirs.setD, "a'b-first.mp4"), common);
  clip(ffmpeg, path.join(dirs.setD, "a'b-second.mp4"), common);

  clip(ffmpeg, path.join(dirs.setE, "01-with-audio.mp4"), common);
  clip(ffmpeg, path.join(dirs.setE, "02-silent.mp4"), { ...common, audio: false });

  clip(ffmpeg, path.join(dirs.single, "only.mp4"), common);

  return dirs;
}
