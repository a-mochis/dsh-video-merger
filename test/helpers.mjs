import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Load the React copy used for the client bundle.  It normally comes from the
 * plugin's devDependencies; `DSH_PROFILE_PACKAGE` is a fallback for a machine
 * where the plugin is linked into a DSH profile and `npm install` was not run.
 */
export function loadReact() {
  const candidates = [
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json"),
    process.env.DSH_PROFILE_PACKAGE,
  ].filter(Boolean);

  const errors = [];
  for (const candidate of candidates) {
    try {
      const req = createRequire(candidate);
      return {
        React: req("react"),
        renderToStaticMarkup: req("react-dom/server").renderToStaticMarkup,
      };
    } catch (error) {
      errors.push(`${candidate}: ${error.message}`);
    }
  }

  throw new Error(
    "React is not available. Run `npm install` in the plugin directory.\n" + errors.join("\n"),
  );
}
