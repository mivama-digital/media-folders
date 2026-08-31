# Release Runbook

This repository keeps the existing `virtual-media-folders` version lineage. Releases use semantic versions and tags in the form `vX.Y.Z`.

## Release prerequisites

Before publishing a release:

1. Start from a clean branch based on `main`.
2. Choose the next semantic version based on the shipped plugin changes.
3. Update all release version metadata together:
   - `package.json`;
   - `package-lock.json` top-level version;
   - `package-lock.json` root package version;
   - `virtual-media-folders.php` plugin header;
   - `VMFO_VERSION` in `virtual-media-folders.php`;
   - `Stable tag` in `readme.txt`.
4. Add the matching version section to both `CHANGELOG.md` and the WordPress.org changelog in `readme.txt`.
5. Confirm `Tested up to` reflects a WordPress version that has actually been tested.
6. Keep release notes limited to changes that are included in the selected version.
7. Merge the release-preparation pull request and require the post-merge CI on `main` to pass before publishing.

`npm run check:release-version` verifies these version surfaces and fails when package, lockfile, plugin, readme, or changelog metadata drift apart.

`npm run release:notes -- X.Y.Z` extracts the matching `CHANGELOG.md` section used as the GitHub release body. CI validates that the prepared version has a non-empty release-notes section.

## Local release validation

Run the same core checks used by CI:

```bash
npm ci
npm run check:engines
npm run security:install-scripts
npm run security:audit
npm run security:audit:runtime
npm run security:audit:dev-baseline
npm run check:licenses
npm test -- --run
npm run build
npm run check:release-version
npm run --silent release:notes -- "$(node -p "require('./package.json').version")" > /tmp/release-notes.md
npm run check:bundle-budget
composer validate --strict
composer install --prefer-dist --no-interaction --no-progress
composer test
composer audit --locked
npm run check:php-runtime-autoload
npm run package:zip
npm run --silent sbom:npm > /tmp/npm-runtime.cdx.json
npm run --silent sbom:composer > /tmp/php-runtime.cdx.json
```

The canonical WordPress archive is `virtual-media-folders.zip` produced by `npm run package:zip` from `.distignore`.

## Distribution contract

The WordPress plugin ZIP is intentionally vendor-free:

- the plugin-owned `autoload.php` loads shipped PHP classes;
- Composer is used for development, testing, and installation metadata;
- `vendor/`, `composer.json`, and `composer.lock` are not shipped in the WordPress ZIP;
- runtime SBOM validation must reflect the files that are actually distributed;
- required runtime files and bundle budgets are checked before release.

Do not introduce a second hand-maintained packaging exclusion list. `.distignore` is the canonical policy used by the GitHub release and WordPress.org deployment paths.

## GitHub release

The preferred publish path is the `Publish GitHub release` workflow.

After the release-preparation pull request is merged and the latest CI on `main` is green:

1. Open **Actions → Publish GitHub release**.
2. Choose **Run workflow** from `main`.
3. Enter `PUBLISH` in the confirmation field.
4. The workflow derives `vX.Y.Z` from the version already committed to `package.json`; there is no independent version input to drift from the source.
5. The workflow refuses to overwrite an existing release or reuse an existing tag from the automated publish path.
6. Before anything is published, the workflow re-runs:
   - Node/npm engine validation;
   - exact install-script policy;
   - npm runtime and development security gates;
   - GPL-compatible runtime-license validation;
   - JavaScript tests;
   - production build and bundle budgets;
   - release-version consistency;
   - PHP tests and Composer audit;
   - vendor-free runtime validation;
   - npm and shipped-PHP CycloneDX SBOM validation;
   - canonical ZIP build;
   - SHA-256 checksum verification.
7. Only after every gate succeeds, `gh release create` creates the missing `vX.Y.Z` tag on the exact validated `main` commit and publishes the GitHub release with all artifacts attached.
8. Verify the published assets include:
   - `virtual-media-folders.zip`;
   - npm runtime CycloneDX SBOM;
   - shipped-PHP runtime CycloneDX SBOM;
   - `SHA256SUMS`.
9. Verify every published checksum before treating the release as complete.

The workflow deliberately publishes only at the end. A failed test, audit, build, SBOM, ZIP, version, or checksum gate therefore cannot create a partial automated release.

### External/manual release fallback

If a release is intentionally created outside the automated workflow, the same workflow still listens for the `release.published` event. It checks out the published tag, validates that the tag matches the committed version metadata, rebuilds the release artifacts, and attaches the canonical ZIP, SBOMs, and checksums.

Do not use the external/manual path to bypass the confirmation-gated automated path or any validation failure.

## WordPress.org deployment

WordPress.org deployment is separate from GitHub release publication.

- The SVN slug is explicitly `virtual-media-folders`.
- Deployment is manual and confirmation-gated.
- Dry-run remains the default.
- A Git tag or GitHub release never silently performs a WordPress.org commit.
- Perform a real WordPress.org deployment only when the required WordPress.org ownership and credentials are configured for the Mivama-maintained release process.

The GitHub release workflow has no WordPress.org credentials and does not call the WordPress.org deployment action.

## Rollback and failed releases

If the automated release workflow fails before publication, fix the source on a new branch, merge it through normal CI, and run the publish workflow again. Do not weaken security, version, bundle, SBOM, checksum, or distribution gates to make a release pass.

The automated path refuses an already existing version tag or release. If a published release contains a plugin defect, prepare a new patch version rather than rewriting an already published version or moving its tag.

## Current known major holds

The dependency baseline documents compatibility-sensitive majors that must remain isolated from normal release preparation. In particular, do not force Babel 8 or React 19 into a release until their current upstream WordPress compatibility blockers are resolved. See [dependencies.md](dependencies.md).
