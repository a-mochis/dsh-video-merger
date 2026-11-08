#!/usr/bin/env node
import { resolveFfmpeg } from "../lib/engine.js";
import { FIXTURE_ROOT, makeFixtures } from "./fixtures.mjs";

const ff = await resolveFfmpeg({ refresh: true });
if (!ff.available) {
  console.error("未找到 ffmpeg / ffprobe。请安装 ffmpeg，或用 --ffmpeg <目录> 指定。");
  process.exit(3);
}

console.log(`ffmpeg: ${ff.ffmpeg}`);
await makeFixtures(ff.ffmpeg);
console.log(`fixtures: ${FIXTURE_ROOT}`);
