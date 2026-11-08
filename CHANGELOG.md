# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
