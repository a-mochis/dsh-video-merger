import assert from "node:assert/strict";
import { loadReact } from "./helpers.mjs";

const { React, renderToStaticMarkup } = loadReact();

let captured = null;
let exportsObj = null;

globalThis.window = {
  __ModuleLoader__: {
    load({ id, factory }) {
      const requireFn = (name) => {
        if (name === "react") return React;
        throw new Error(`unexpected require: ${name}`);
      };
      exportsObj = factory(requireFn);
      console.log("loaded bundle id:", id);
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

const ctx = {
  effect(fn) { return fn(); },
  get(name) {
    if (name === "locale") {
      return {
        getSnapshot: () => ({ active: "zh" }),
        getLocale: () => "zh",
        subscribe: () => () => {},
      };
    }
    if (name === "uiWorkspace") {
      return { listDirectory: async () => [] };
    }
    return undefined;
  },
  slots: {
    register(meta, component) {
      captured = { meta, component };
      return () => {};
    },
    inject(_slot, fn) { fn(); },
  },
};

exportsObj.apply(ctx);
if (!captured) throw new Error("no view registered");
console.log("registered:", captured.meta.name, captured.meta.id, "tab label:", captured.meta.label());

const props = {
  sessionId: "test-session",
  locale: ctx.get("locale"),
  uiWorkspace: ctx.get("uiWorkspace"),
};
const html = renderToStaticMarkup(React.createElement(captured.component, props));
assert.ok(html.length > 3000, `rendered HTML is too short: ${html.length}`);
for (const needle of ["视频合并", "根目录", "统一输出", "输出文件夹", "管理"]) {
  assert.ok(html.includes(needle), `rendered HTML is missing ${needle}`);
}
console.log(`render: ok (${html.length} chars)`);
