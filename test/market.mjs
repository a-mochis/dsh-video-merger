import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));

const pkg = readJson("package.json");
const index = readJson("market/index.json");

assert.equal(index.format, 1, "market index format must be 1");
assert.equal(typeof index.title?.en, "string", "index title.en is required");
assert.ok(Array.isArray(index.plugins) && index.plugins.length > 0, "index must list plugins");

const plugin = index.plugins.find((entry) => entry.name === pkg.name);
assert.ok(plugin, `index must contain ${pkg.name}`);

const version = plugin.versions.find((entry) => entry.version === pkg.version);
assert.ok(version, `index must contain version ${pkg.version}`);
assert.equal(typeof version.publishTimestamp, "number", "publishTimestamp must be a number");
assert.ok(Number.isInteger(version.publishTimestamp) && version.publishTimestamp >= 0);

const source = version.source;
assert.equal(source.type, "git");
assert.match(source.commit, /^[0-9a-f]{40}$/, "commit must be a 40-character lowercase SHA");
assert.match(source.url, /^https:\/\/github\.com\/[^/]+\/[^/]+$/, "source url must be a canonical https repo URL");

assert.equal(typeof plugin.homepage, "string");
assert.match(plugin.homepage, /^https:\/\//);
assert.match(plugin.repository?.url ?? "", /^https:\/\//);

const icon = plugin.icon ?? "";
assert.ok(icon.length > 0, "plugin icon is required");
if (!icon.startsWith("data:")) {
  const iconPath = path.resolve(root, "market", icon);
  assert.ok(fs.existsSync(iconPath), `icon does not exist: ${iconPath}`);
}

for (const image of ["docs/how-to-select-folder.svg", "docs/how-to-merge.svg"]) {
  assert.ok(fs.existsSync(path.join(root, image)), `README image does not exist: ${image}`);
}

console.log(`market index: ok (${pkg.name}@${pkg.version}, ${source.commit.slice(0, 7)})`);
