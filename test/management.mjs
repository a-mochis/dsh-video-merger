import assert from "node:assert/strict";
import { loadReact } from "./helpers.mjs";

const { React } = loadReact();

const store = new Map();
globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); },
};

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

await import("../lib/client.js");

const history = exportsObj._history;
assert.ok(history, "history helpers are not exposed");

for (let i = 0; i < 10; i += 1) history.rememberRoot(`E:\\clips\\set${i}`, 1000 + i);
let roots = history.loadRoots();
assert.equal(roots.length, 8, "root history must be capped at 8");
assert.equal(roots[0].path, "E:\\clips\\set9", "newest root must come first");

roots = history.rememberRoot("E:\\clips\\set3", 5000);
assert.equal(roots.length, 8, "remembering an existing root must not grow the list");
assert.equal(roots[0].path, "E:\\clips\\set3", "reused root must move to the front");
assert.equal(roots.filter((item) => item.path === "E:\\clips\\set3").length, 1, "root history must be de-duplicated");

for (let i = 0; i < 25; i += 1) history.rememberRun({ id: `job-${i}`, at: 2000 + i, done: i });
const runs = history.loadRuns();
assert.equal(runs.length, 20, "run history must be capped at 20");
assert.equal(runs[0].id, "job-24", "newest run must come first");

history.rememberRun({ id: "job-24", at: 9000, done: 99 });
assert.equal(history.loadRuns().length, 20, "duplicate run id must not grow the list");
assert.equal(history.loadRuns().find((item) => item.id === "job-24").done, 99, "duplicate run must be replaced");

assert.ok(history.fmtWhen(Date.now(), "zh"), "fmtWhen should produce a timestamp");

console.log("management history: ok");
