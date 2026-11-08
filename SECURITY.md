# Security policy

## Supported versions

Security fixes are applied to the latest `1.x` release.

## Reporting a vulnerability

Open a private report through
[GitHub Security Advisories](https://github.com/a-mochis/dsh-video-merger/security/advisories/new).
Please include the version, the affected command or UI action, and a minimal
reproduction. Do not publish the issue before a fix is available.

## Trust model

- The plugin runs ffmpeg and ffprobe from the configured or discovered local
  installation. Those binaries execute with your user permissions; install them
  from a source you trust.
- The Web UI and the `merge_folder_videos` tool only operate on absolute paths
  you provide. The Host route accepts requests from the local DSH renderer.
- The optional ffmpeg downloader fetches the official Windows build from
  `https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip` and verifies
  the ZIP structure before extracting the two executables. It does not check a
  signature; use a package manager if you need signature verification.
- The plugin makes no telemetry requests. The only outbound request is the
  ffmpeg download you explicitly start.
