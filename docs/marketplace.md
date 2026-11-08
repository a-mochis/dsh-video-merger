# Publishing the plugin index

`dsh-video-merger` ships a one-plugin [format-1 market index](../market/index.json)
so it can be discovered from **Plugins → Discover** without waiting for a central
catalog review.

## Index URL

```text
https://cdn.jsdelivr.net/gh/a-mochis/dsh-video-merger@main/market/index.json
```

Add it under **Plugins → Discover → Index sources → Add index source**. Discover
reads the index, shows the **Video Merger / 视频合并** card, and installs the
version pinned by the index.

This is a personal index hosted beside the project. It is separate from the
curated [Awesome DSH Plugins](https://github.com/DshMarketPlace/awesome-dsh-plugin)
list, which is maintained through pull requests.

## Updating the index for a release

1. Commit and push the release.
2. Set `plugins[0].versions[0].version` to the released version.
3. Set `source.commit` to the full 40-character commit SHA of that release.
4. Set `publishTimestamp` to the release time in Unix seconds.
5. Run `npm run test:market`.
6. Commit `market/index.json`; jsDelivr picks up `@main` after its cache refresh.

`source.commit` is what installs the bundle, so it must point at a commit whose
`package.json` has the same version as the index entry.

## Submitting to the curated list

The curated list uses `data/curated.yml`, not this index. See
[CONTRIBUTING.md](https://github.com/DshMarketPlace/awesome-dsh-plugin/blob/main/CONTRIBUTING.md)
for the current criteria — public repository, documented installation, license,
`dsh-plugin` and `deepseek-harness` topics, and an active commit history.
