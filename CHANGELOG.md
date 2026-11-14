# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-14

### Added

- Four explicit merge paths: lossless copy, MPEG-TS remux, audio-only repair,
  and single-pass encode. The UI shows which path and encoder each folder used.
- Hardware encoder detection with automatic fallback: NVENC → QSV → AMF →
  libx264/libx265. The probe result is cached per ffmpeg binary. If a hardware
  encoder fails mid-run, the folder is retried once with the software encoder.
- `test/fixtures.mjs` setF (non-zero start time) to cover the remux path; the
  end-to-end test now asserts the merge mode as well as the output spec.
- `test/market.mjs`, which checks the index against `package.json`.
- Format-1 market index (`market/index.json`) and icon for Discover, plus a
  marketplace publishing guide.
- Step-by-step screenshots for choosing a folder and starting a merge.
- Security policy and troubleshooting guide.

### Changed

- Copy signatures now include profile, level, time base, SAR, rotation, field
  order, colour metadata, VFR and audio profile/layout. This prevents clips that
  only looked equal from being stream-copied.
- The old `-fflags +genpts -avoid_negative_ts make_zero` copy path is gone; a
  timestamp warning or copy failure now falls back to a TS remux.
- The encode path joins all clips with one concat filter instead of encoding
  every clip to an intermediate file. Intermediate fast-start rewrites are gone.
- Video-only differences no longer trigger a video re-encode; audio-only
  differences are repaired without touching the video stream.
- Documented the `dsh plugin add` installation path alongside
  `plugin_manager install_bundle`.

### Fixed

- Stuttering and frozen frames at segment seams caused by incorrectly matching
  clips and by `-c copy` with forced timestamp generation.
- Excessive work on folders where only audio parameters differed.

## [1.0.4] - 2026-11-08

### Added

- A Data management dialog that can clear the current selection, the folder
  history, and the merge history, plus a one-click "Clear everything" action.
- The last eight root folders are remembered and can be restored with one click.
- The last twenty finished merge jobs are recorded locally with status, folder
  count, output size and output folder.
- `test/management.mjs` for the history caps, de-duplication and formatting.

## [1.0.3] - 2026-11-08

### Changed

- The in-app ffmpeg download is only offered on Windows, where the bundled
  guidance (gyan.dev build) applies. macOS and Linux users are directed to
  their package manager or an existing ffmpeg installation.
- Added project metadata, license, changelog, contribution guide, issue
  templates, and GitHub Actions CI.

## [1.0.2] - 2026-11-08

### Added

- Optional unified output folder for the Web UI, the `merge_folder_videos`
  tool (`outputDir`), and the CLI (`--out`).
- Nested source folders are prefixed with their relative path (for example
  `a_b_merged.mp4`) so outputs never collide in a shared folder.
- In-app directory browser built on `uiWorkspace.listDirectory`, replacing the
  Host-native picker that is unavailable in the browser-based Web GUI.
- Portable test fixtures, a fixture generator, and GitHub Actions CI.

### Fixed

- Missing audio in the normalized path when only some clips had audio; the
  merge now keeps the first available audio track and pads silence.
- Progress could jump backwards when ffmpeg only emitted a `speed=` line.
- Reserved characters are sanitized from unified-output names, including
  cross-drive relative paths.

## [1.0.1] - 2026-11-08

### Fixed

- "Select folder" failed with `directoryPicker.pick needs the native
  capability; the composed picker serves "browse"` in the Web GUI.
- Directory listing normalization now accepts the Host `DirectoryListing`
  shape (`entries` without type markers) and treats untyped entries as folders.

## [1.0.0] - 2026-11-07

### Added

- Initial release: recursive folder scanning, ffprobe-based spec comparison,
  lossless concat for matching clips, and a transcode-and-align fallback for
  mixed clips.
- Web UI tab (`conversation.view`), per-folder progress, cancel, play/reveal.
- `merge_folder_videos` tool for conversational use.
- Standalone CLI (`bin/merge-videos.mjs`).
- ffmpeg discovery, in-app download, and configuration in
  `%DSH_HOME%/plugin-data/dsh-video-merger`.
