# Dependency baseline

This document records the dependency baseline and maintenance policy for `media-folders` after the standalone Mivama dependency migration.

## Runtime policy

- Node.js: `>=24 <25`
- npm: `>=11 <12`
- PHP: `>=8.3`
- JavaScript lockfile: `package-lock.json` (`lockfileVersion: 3`)
- PHP lockfile: `composer.lock`
- Floating `latest` dependency specifications are prohibited.
- `npm audit fix --force` and `--legacy-peer-deps` are prohibited as routine maintenance tools.
- Major dependency upgrades must be isolated from feature changes and validated through the full test/build pipeline.
- WordPress.org deployment remains manual and must use a release tag whose version matches all plugin metadata.

## Current security baseline

- npm packages in lockfile: 1804
- npm vulnerabilities in the full development graph: 32 total (`0 critical`, `10 high`, `21 moderate`, `1 low`)
- npm vulnerabilities in the runtime graph (`--omit=dev`): 1 total (`0 critical`, `0 high`, `0 moderate`, `1 low`)
- Composer advisories: `0`

The remaining high/moderate npm findings are in the WordPress development/build toolchain. They are reported in CI but are not treated as equivalent to vulnerabilities in the distributed plugin runtime. Runtime high/critical findings and Composer advisories are hard CI failures.

## Reviewed npm install scripts

npm install-time lifecycle scripts are controlled through the project `allowScripts` policy and `.npmrc` enables `strict-allow-scripts=true`. Only the currently reviewed package versions are approved:

- `@parcel/watcher@2.6.0`
- `core-js@3.50.0`
- `core-js-pure@3.48.0`
- `esbuild@0.27.3`
- `fsevents@2.3.2`
- `fsevents@2.3.3`
- `unrs-resolver@1.12.2`

The two `fsevents` versions are macOS-only native filesystem watchers (`os: darwin`) present transitively in the locked toolchain. They are approved by exact version rather than by package name so a future native build change requires another review.

A dependency update that introduces a new install script or changes one of these approved versions must be reviewed and explicitly re-approved. CI should fail rather than silently broadening the policy.

## Direct npm runtime dependencies

- `@dnd-kit/core`: `^6.3.1`
- `@dnd-kit/modifiers`: `^9.0.0`
- `@dnd-kit/sortable`: `^10.0.0`
- `@wordpress/api-fetch`: `7.41.0`
- `@wordpress/components`: `36.1.0`
- `@wordpress/data`: `10.50.0`
- `@wordpress/element`: `8.2.0`
- `@wordpress/i18n`: `6.23.0`
- `@wordpress/icons`: `15.1.0`

## Direct npm development dependencies

- `@testing-library/dom`: `^10.4.1`
- `@testing-library/jest-dom`: `^7.0.1`
- `@testing-library/react`: `^16.3.2`
- `@testing-library/user-event`: `^14.6.6`
- `@vitejs/plugin-react`: `^5.1.4`
- `@wordpress/scripts`: `^34.2.0`
- `jsdom`: `^30.0.1`
- `react`: `^18.3.1`
- `react-dom`: `^18.3.1`
- `vitest`: `^4.1.11`

`@vitejs/plugin-react` intentionally remains on major 5 because major 6 requires Vite 8 and conflicts with the currently validated Vite/Vitest toolchain.

## CI and release gates

The permanent pipeline validates:

- deterministic `npm ci` under the strict install-script policy;
- runtime npm security audit as a hard gate;
- full development npm audit as a visible non-blocking report while upstream WordPress tooling still carries known advisories;
- JavaScript tests and production build;
- PHP tests and `composer audit --locked`;
- consistency between `package.json`, the WordPress plugin header, `readme.txt`, and release tags;
- bundle-size budgets for primary JavaScript bundles;
- distributable plugin files and the actual `virtual-media-folders.zip` archive;
- one canonical `.distignore` policy for GitHub release packaging and WordPress.org trunk deployment;
- npm and Composer runtime CycloneDX SBOM generation;
- SHA-256 checksums for the ZIP and both SBOMs;
- pull-request dependency review for new high-severity dependency changes once GitHub Dependency Graph is enabled for the repository.

GitHub Actions and WordPress.org deployment actions are pinned to immutable commit SHAs. Dependabot groups minor/patch updates by compatibility domain; major upgrades remain isolated instead of being bundled into routine update PRs.

## WordPress.org deployment contract

The GitHub repository is named `media-folders`, while the existing WordPress.org/plugin slug is `virtual-media-folders`. Deployment workflows therefore set the WordPress.org slug explicitly and never derive it from the repository name.

The manual plugin deployment workflow also resolves the SVN version from the selected release tag, validates SemVer, verifies the tag against plugin metadata, and defaults to the 10up action's dry-run mode. A real SVN commit remains an explicit manual choice and requires authorized Mivama-owned WordPress.org credentials.

## Repository security prerequisite

GitHub Dependency Review requires the repository Dependency Graph. If that repository-level setting is disabled, the Dependency Review action cannot evaluate a pull request. Enable **Settings → Security / Code security → Dependency graph** before making the Dependency Review job a required merge gate.

## Maintenance commands

```bash
npm ci
npm run security:install-scripts
npm run security:audit:runtime
npm run security:audit
npm test -- --run
npm run build
npm run check:release-version
npm run check:bundle-budget
npm run sbom:npm
npm run sbom:composer
composer install --no-dev --prefer-dist --optimize-autoloader
npm run package:zip
npm run deps:outdated
npm run deps:tree
composer validate --strict
composer test
composer audit --locked
composer outdated --direct
```

Security findings must be resolved through the dependency path that introduces them. Overrides require written justification, a narrowly scoped version range, and a clear removal condition.
