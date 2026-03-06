# Backstage upgrade helper diff

This repository tracks the output of `npx @backstage/create-app` across Backstage releases. For each release, a dedicated branch captures the exact state of the generated app template, and diff files are computed between every pair of versions. This way, the diffs are always clean and always in sync with the changes to the init template.

## Find the diff you need

https://backstage.github.io/upgrade-helper/

## How it works

### Branch structure

For each Backstage release version (e.g. `1.48.0`), the following branches are created:

| Branch                                    | Contents                                                                                                                                                                                                                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `release/{createAppVersion}`              | Bare output of `npx @backstage/create-app@{createAppVersion}`, where `createAppVersion` is the version of `@backstage/create-app` shipped with the release                                                                                                        |
| `release/yarn-plugin/{releaseVersion}`    | Same as above, but with Backstage packages bumped via `versions:bump --release {releaseVersion}` using the [Backstage yarn plugin](https://backstage.io/docs/getting-started/keeping-backstage-updated/#managing-package-versions-with-the-backstage-yarn-plugin) |
| `release-diff/legacy/v{createAppVersion}` | One `.diff` file per older createApp version, showing the diff between the two `release/*` branches                                                                                                                                                               |
| `release-diff/v{releaseVersion}`          | One `.diff` file per older release version, showing the diff between the two `release/yarn-plugin/*` branches                                                                                                                                                     |

### Tracked releases

`releases.json` and `releases-yarn-plugin.json` on `master` are the source of truth for which releases have been processed. Both map `releaseVersion → { createApp: createAppVersion }`.

### Automation

The workflow [`.github/workflows/release.yml`](.github/workflows/release.yml) runs two jobs:

1. **`detect`** — Fetches the last releases from `backstage/backstage` on GitHub, resolves the `@backstage/create-app` version for each from the [Backstage versions manifest](https://github.com/backstage/versions), filters out already-tracked releases, and outputs a JSON array sorted oldest-first by publication date.

2. **`process`** — Loops over each detected release sequentially and:
   1. Creates `release/{createAppVersion}` using `@backstage/create-app`
   2. Creates `release/yarn-plugin/{releaseVersion}` using `@backstage/create-app`
   3. Creates or updates `release-diff/legacy/v{createAppVersion}` with diffs from all older `release/*` branches
   4. Backfills any existing future `release-diff/legacy/*` branches that are missing a diff from this release
   5. Creates or updates `release-diff/v{releaseVersion}` with diffs from all older `release/yarn-plugin/*` branches
   6. Backfills any existing future `release-diff/v*` branches that are missing a diff from this release
   7. Updates `releases.json` and `releases-yarn-plugin.json` on `master`

All steps are idempotent — already-existing branches and diff files are never overwritten.

## Operator guide

### Running the workflow

Go to **Actions → Create new release diffs → Run workflow**.

- **No input**: auto-detects all untracked releases (up to the last 50 from GitHub) and processes them in order.
- **"Backstage release version to process"** (e.g. `1.48.0` or `v1.48.0`): processes only that specific release. Useful for reprocessing a release or filling in missing diffs.
- **"Re-process already-tracked releases"** checkbox (no release version specified): re-processes all releases from the last 50, including already-tracked ones. Useful for bulk backfilling missing diffs across all recent releases.

## Notes

This project follows the same concepts introduced by [React Native diff PURGE](https://github.com/react-native-community/rn-diff-purge). Read more [here](https://github.com/react-native-community/rn-diff-purge/blob/master/README.md#history-of-this-repo) about the idea and history behind the project.
