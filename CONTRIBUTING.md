# Contributing

Thanks for taking the time to improve `dsh-video-merger`.

## Before opening an issue

- Search existing issues first.
- For merge problems, include the ffmpeg version, the source specs
  (`ffprobe` output is ideal), and the plugin's error message.
- Do not attach private videos. A short synthetic clip that reproduces the
  problem is enough.

## Development setup

```bash
git clone https://github.com/a-mochis/dsh-video-merger.git
cd dsh-video-merger
npm install
```

You need `ffmpeg` and `ffprobe` on `PATH`, or pass `--ffmpeg <dir>` to the
tests. On Windows the plugin also looks for common local installations.

```bash
npm run check       # node --check on every runtime file
npm test            # directory-listing + React SSR tests
npm run test:merge  # generates clips, merges them, asserts the output specs
```

`npm run test:merge` creates `test/fixtures/` and `test/output/`; both are
ignored by git. To regenerate the fixtures explicitly, run `npm run fixtures`.

## Installing a development build into DSH

Point the DSH plugin manager at the absolute path of this directory:

```text
plugin_manager install_bundle target = <absolute path to dsh-video-merger>
```

Re-run the install (or remove and install again) after changing `package.json`
or the client bundle, then force-refresh the Web UI.

## Pull requests

- Keep changes focused; one concern per PR.
- Add or update a test when behavior changes.
- Run `npm run check`, `npm test`, and `npm run test:merge` before pushing.
- Match the existing style: ESM, two-space indent, no runtime dependencies
  beyond Node's standard library and the Host-provided React.
- Never commit credentials, downloaded ffmpeg binaries, or test media.

## Commit messages

Short imperative subject lines are preferred, for example:

```text
fix: keep audio when only some clips contain a track
feat: add unified output folder
docs: describe the spec-matching rules
```
