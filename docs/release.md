# Release Runbook

This repository keeps the existing `virtual-media-folders` version lineage. Releases use semantic versions and tags in the form `vX.Y.Z`.

## Release prerequisites

Before creating a release tag:

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

`npm run check:release-version` verifies these version surfaces and fails when package, lockfile, plugin, readme, or changelog metadata drift apart.

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
npm run check:bundle-budget
composer validate --strict
composer install --prefer-dist --no-interaction --no-progress
composer test
composer audit --locked
npm run check:php-runtime-autoload
npm run package:zip
npm run sbom:npm > /tmp/npm-runtime.cdx.json
npm run sbom:composer > /tmp/php-runtime.cdx.json
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

After the release-preparation pull request is merged and `main` is green:

1. Verify `main` still passes `npm run check:release-version`.
2. Create the exact `vX.Y.Z` tag for the prepared version.
3. Publish the GitHub release for that tag.
4. Let the release workflow rebuild and validate the plugin from the tagged commit.
5. Verify the published assets include:
   - `virtual-media-folders.zip`;
   - npm runtime CycloneDX SBOM;
   - shipped-PHP runtime CycloneDX SBOM;
   - `SHA256SUMS`.
6. Verify every published checksum before treating the release as complete.

The GitHub release workflow must fail if the tag version and plugin metadata differ.

## WordPress.org deployment

WordPress.org deployment is separate from GitHub release publication.

- The SVN slug is explicitly `virtual-media-folders`.
- Deployment is manual and confirmation-gated.
- Dry-run remains the default.
- A Git tag or GitHub release must never silently perform a WordPress.org commit.
- Perform a real WordPress.org deployment only when the required WordPress.org ownership and credentials are configured for the Mivama-maintained release process.

## Rollback and failed releases

If a release workflow fails before publication, fix the source and prepare a new commit before retrying. Do not weaken security, version, bundle, SBOM, checksum, or distribution gates to make a release pass.

If a published release contains a plugin defect, prepare a new patch version rather than rewriting an already published version tag.

## Current known major holds

The dependency baseline documents compatibility-sensitive majors that must remain isolated from normal release preparation. In particular, do not force Babel 8 or React 19 into a release until their current upstream WordPress compatibility blockers are resolved. See [dependencies.md](dependencies.md).
