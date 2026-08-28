# Upstream relationship

## Origin

This repository is based on **Virtual Media Folders**, originally created and maintained by Per Søderlind:

- Upstream repository: https://github.com/soderlind/virtual-media-folders
- Original plugin slug: `virtual-media-folders`
- License: GPL-2.0-or-later

The Git history and original copyright notices are preserved.

## Mivama maintenance model

`mivama-digital/media-folders` is maintained as an independent Mivama distribution with its own:

- roadmap;
- issue and pull-request process;
- CI and release gates;
- release notes;
- security process;
- support and compatibility decisions.

The repository may be detached from GitHub's fork network. Detaching changes GitHub repository topology only; it does not erase project origin, authorship, commit history, or license obligations.

## Upstream synchronization

Upstream changes are reviewed deliberately rather than merged automatically.

Recommended local remotes:

```text
origin   https://github.com/mivama-digital/media-folders.git
upstream https://github.com/soderlind/virtual-media-folders.git
```

Recommended review flow:

1. `git fetch upstream`
2. inspect changes since the last reviewed upstream commit;
3. identify security fixes, WordPress compatibility fixes, bug fixes, and useful improvements;
4. port, cherry-pick, or reimplement only the changes that fit the Mivama roadmap;
5. run the full Mivama CI suite;
6. document material upstream-derived changes in the release notes.

Do not automatically merge `upstream/main` into `main`.

## Versioning

Mivama continues the existing plugin version lineage. The plugin currently belongs to the `2.x` line, so the Mivama distribution must not reset to `1.0.0` while retaining the existing WordPress plugin slug and update identity.

Git tags use the form `vX.Y.Z`.

## Attribution rules

When changing the codebase:

- preserve existing copyright and license notices where applicable;
- do not rewrite Git history to hide upstream authorship;
- distinguish Mivama maintenance/branding from original authorship;
- keep GPL-2.0-or-later compatibility for distributed derivative code;
- review upstream-specific URLs individually instead of blindly replacing every reference.

## GitHub fork-network status

The `forked from ...` banner is useful while the repository is technically a GitHub fork, but it is not the long-term source of attribution. Attribution is intentionally recorded in this file, the README, source headers, Git history, and license metadata so it remains visible after a fork-network detachment.