# Dependency baseline

This document records the dependency baseline and maintenance policy for `media-folders` after the standalone Mivama dependency migration and the focused JavaScript toolchain cleanup.

## Runtime policy

- Node.js: `>=24 <25`
- npm: `>=11 <12`
- PHP: `>=8.3`
- JavaScript lockfile: `package-lock.json` (`lockfileVersion: 3`)
- PHP lockfile: `composer.lock`
- `.npmrc` enables both `engine-strict=true` and `strict-allow-scripts=true`.
- Floating `latest` dependency specifications are prohibited.
- `npm audit fix --force` and `--legacy-peer-deps` are prohibited as routine maintenance tools.
- Major dependency upgrades must be isolated from feature changes and validated through the full test/build pipeline.
- WordPress.org deployment remains manual and must use a release tag whose version matches all plugin metadata.

## Focused JavaScript toolchain

The repository no longer depends on the `@wordpress/scripts` meta-package. The plugin only needs a subset of that stack, so the build is now explicit and intentionally small:

- Webpack + webpack-cli for bundling and watch mode;
- `@wordpress/babel-preset-default` + Babel loader for WordPress-compatible JavaScript transpilation;
- `@wordpress/dependency-extraction-webpack-plugin` for WordPress externals and `*.asset.php` manifests;
- `@wordpress/postcss-plugins-preset`, PostCSS, cssnano, and MiniCssExtractPlugin for CSS;
- Sass Embedded + sass-loader for the repository's SCSS source;
- rtlcss for generated `*-rtl.css` assets;
- Terser for production JavaScript minimization;
- Vitest/Vite/jsdom and Testing Library for JavaScript tests.

`npm run start` is a Webpack watch build. The repository does not run a Webpack development server, so there is no reason to carry the dev-server/SockJS dependency chain.

Removing the meta-package also removes tool families that this plugin does not use directly, including the WordPress E2E/Lighthouse/Puppeteer/OpenTelemetry stack, Markdown linting stack, generic Webpack dev server, and the copy-plugin chain.

The focused graph preserves the existing plugin build contract: JavaScript bundles, CSS, RTL CSS, WordPress dependency extraction, and generated asset manifests.

## Current security baseline

On Node.js 24.19.0 / npm 11.17.0 CI:

- `package-lock.json`: 687 non-root package entries, including platform-specific optional packages;
- Linux `npm ci`: 610 packages installed / 611 packages audited including the project root;
- full npm audit: 1 total (`0 critical`, `0 high`, `0 moderate`, `1 low`);
- runtime audit gate: no High or Critical findings;
- Composer advisories: `0`.

The previous WordPress meta-tooling baseline was 32 npm findings (`10 high`, `21 moderate`, `1 low`). The focused toolchain removes all High and Moderate findings from that graph.

The remaining Low finding is `GHSA-g7r4-m6w7-qqqr` in `esbuild@0.27.3`, concerning the esbuild development server on Windows. This repository does not use the esbuild development server, but the finding remains visible and ratcheted in `security/npm-audit-baseline.json` until the validated Vite/Vitest dependency line resolves it.

`npm run security:audit:dev-baseline` is a blocking gate. It fails when:

- a new advisory ID appears;
- an existing advisory becomes more severe than reviewed;
- any severity count exceeds the reviewed ceiling;
- any Critical advisory exists; or
- a reviewed advisory disappears without the baseline being reduced in the same change.

That last rule makes the baseline ratcheting: once dependency debt is removed, the repository must record the improvement and may not silently reintroduce it later.

Runtime High/Critical findings and Composer advisories remain unconditional hard failures independent of the development baseline.

## Reviewed npm install scripts

npm install-time lifecycle scripts are controlled through the project `allowScripts` policy and `.npmrc` enables `strict-allow-scripts=true`. The focused graph currently requires exactly four reviewed lifecycle-script packages:

- `@parcel/watcher@2.6.0`
- `core-js@3.50.0`
- `esbuild@0.27.3`
- `fsevents@2.3.3`

`fsevents` is the macOS filesystem-watcher implementation. Approval is version-specific so a future native build change requires another review.

A dependency update that introduces a new install script or changes one of these approved versions must be reviewed and explicitly re-approved. CI fails rather than silently broadening the policy.

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

The WordPress JavaScript packages are externalized by the dependency-extraction plugin and represented by WordPress script handles in `build/*.asset.php`; they are not bundled as duplicate WordPress framework copies.

## Direct npm development dependency groups

### Build

- `@babel/core`
- `@wordpress/babel-preset-default`
- `@wordpress/browserslist-config`
- `@wordpress/dependency-extraction-webpack-plugin`
- `@wordpress/postcss-plugins-preset`
- `babel-loader`
- `browserslist`
- `css-loader`
- `cssnano`
- `mini-css-extract-plugin`
- `postcss`
- `postcss-loader`
- `rtlcss`
- `sass-embedded`
- `sass-loader`
- `terser-webpack-plugin`
- `webpack`
- `webpack-cli`

### Test

- `@testing-library/dom`
- `@testing-library/jest-dom`
- `@testing-library/react`
- `@testing-library/user-event`
- `@vitejs/plugin-react`
- `jsdom`
- `react`
- `react-dom`
- `vitest`

React remains a development/test dependency because the plugin build externalizes the WordPress/React runtime instead of shipping a private React copy.

## License policy

The repository and plugin are `GPL-2.0-or-later`. `package.json` records that license explicitly.

`npm run check:licenses` starts from the project's direct `dependencies` and walks their installed `dependencies` and `optionalDependencies`. It intentionally does not treat development dependencies or external peer contracts as plugin runtime dependencies. Every reachable package must use a license accepted by the repository's GPLv2-compatible allowlist.

This distinction is important for the focused build stack: Sass, Vite, Webpack, and their build-only transitive packages are development tooling and are not mislabeled as distributed plugin runtime dependencies.

New runtime dependencies must therefore be both technically justified and license-compatible with the plugin distribution.

## Build-contract validation

The focused toolchain has been compared against the previous production build. It preserves the WordPress dependency handles in the primary asset manifests. For example, `build/admin.asset.php` continues to declare:

- `react`
- `react-dom`
- `react-jsx-runtime`
- `wp-api-fetch`
- `wp-components`
- `wp-element`
- `wp-i18n`
- `wp-primitives`

Current primary JavaScript sizes are:

- `build/admin.js`: 90,629 bytes;
- `build/editor.js`: 13,894 bytes;
- `build/shared.js`: 15,990 bytes;
- primary total: 120,513 bytes.

All remain below the repository's existing bundle budgets. Generated CSS, RTL CSS, and `*.asset.php` files are committed together with the toolchain change so source and distributable assets stay synchronized.

## CI and release gates

The permanent pipeline validates:

- deterministic `npm ci` with strict engine and install-script enforcement;
- Node.js/npm engine compatibility;
- exact reviewed install-script coverage;
- runtime npm security audit as a hard gate;
- the ratcheting full-development npm advisory baseline as a hard gate;
- GPL-compatible reachable production npm dependency licenses;
- JavaScript tests and production build;
- PHP tests and `composer audit --locked`;
- consistency between `package.json`, the WordPress plugin header, `readme.txt`, and release tags;
- bundle-size budgets for primary JavaScript bundles;
- distributable plugin files and the actual `virtual-media-folders.zip` archive;
- one canonical `.distignore` policy for GitHub release packaging and WordPress.org trunk deployment;
- npm and Composer runtime CycloneDX SBOM generation;
- SHA-256 checksums for the ZIP and both SBOMs;
- pull-request dependency review for new high-severity dependency changes once GitHub Dependency Graph is enabled for the repository.

CI also runs weekly so changes in external advisory data are detected even when the lockfiles have not changed.

GitHub Actions and WordPress.org deployment actions are pinned to immutable commit SHAs. Dependabot groups minor/patch updates by compatibility domain; major upgrades remain isolated instead of being bundled into routine update PRs.

## WordPress.org deployment contract

The GitHub repository is named `media-folders`, while the existing WordPress.org/plugin slug is `virtual-media-folders`. Deployment workflows therefore set the WordPress.org slug explicitly and never derive it from the repository name.

The manual plugin deployment workflow also resolves the SVN version from the selected release tag, validates SemVer, verifies the tag against plugin metadata, and defaults to the 10up action's dry-run mode. A real SVN commit remains an explicit manual choice and requires authorized Mivama-owned WordPress.org credentials.

## Repository security prerequisite

GitHub Dependency Review requires the repository Dependency Graph. If that repository-level setting is disabled, the Dependency Review action cannot evaluate a pull request. Enable **Settings → Security / Code security → Dependency graph** before making the Dependency Review job a required merge gate.

## Maintenance commands

```bash
npm ci
npm run check:engines
npm run security:install-scripts
npm run security:audit:runtime
npm run security:audit:dev-baseline
npm run check:licenses
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

For investigation, `npm run security:audit` prints the raw full audit report. Security findings must be resolved through the dependency path that introduces them. Overrides require written justification, a narrowly scoped version range, and a clear removal condition.
