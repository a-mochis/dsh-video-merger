import assert from "node:assert/strict";
import { loadReact } from "./helpers.mjs";

const { React } = loadReact();

let exportsObj = null;
globalThis.window = {
  __ModuleLoader__: {
    load({ factory }) {
      exportsObj = factory((name) => {
        if (name === "react") return React;
        throw new Error(`unexpected require: ${name}`);
      });
    },
  },
};
globalThis.document = {
  head: { appendChild() {} },
  createElement() {
    return { dataset: {}, textContent: "", remove() {}, setAttribute() {} };
  },
  querySelector() { return null; },
  addEventListener() {},
  removeEventListener() {},
};

await import("../lib/client.js");

const normalize = exportsObj._normalizeListing;
assert.equal(typeof normalize, "function");

// Exact Host `DirectoryListing` shape: entries are folders and carry no type.
const hostShape = {
  path: "E:\\videos",
  home: "C:\\Users\\Administrator",
  crumbs: [
    { name: "E:", path: "E:\\", hidden: false },
    { name: "videos", path: "E:\\videos", hidden: false },
  ],
  entries: [
    { name: "b rollers", path: "E:\\videos\\b rollers", hidden: false },
    { name: "a clips", path: "E:\\videos\\a clips", hidden: false },
  ],
  truncated: false,
};

const listing = normalize(hostShape, "E:\\videos");
assert.equal(listing.path, "E:\\videos");
assert.deepEqual(listing.dirs.map((d) => d.name), ["a clips", "b rollers"]);
assert.equal(listing.dirs[0].path, "E:\\videos\\a clips");

// Explicit file markers must never render as folders.
const mixed = normalize({ path: "E:\\videos", entries: [
  { name: "clip.mp4", path: "E:\\videos\\clip.mp4", isFile: true },
  { name: "sub", path: "E:\\videos\\sub" },
] }, "E:\\videos");
assert.deepEqual(mixed.dirs.map((d) => d.name), ["sub"]);

// Bare arrays (alternate host shapes) still work.
const bare = normalize([
  { name: "one", path: "E:\\one", isDirectory: true, hidden: true },
  { name: "two", path: "E:\\two", kind: "directory" },
], "E:\\");
assert.deepEqual(bare.dirs.map((d) => d.name), ["one", "two"]);
assert.equal(bare.dirs[0].hidden, true);

console.log("browse normalize: ok");
