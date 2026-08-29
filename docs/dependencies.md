# Dependency baseline

This document records the dependency baseline and maintenance policy for `media-folders` after the standalone Mivama dependency migration, focused JavaScript toolchain cleanup, and zero-advisory hardening.

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

The repository no longer depends on the `@wordpress/scripts` meta-package. The plugin only needs a subset of that stack, so the build is explicit and intentionally small:

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

## Zero-advisory security baseline

On Node.js 24.19.0 / npm 11.17.0 CI:

- Linux `npm ci`: 537 packages installed / 538 packages audited including the project root;
- full npm audit: `0` vulnerabilities;
- runtime npm audit: `0` vulnerabilities, enforced from Low severity upward;
- ratcheting development audit baseline: `0 critical`, `0 high`, `0 moderate`, `0 low`, `0 total`;
- GPL-compatible runtime license traversal: 75 reachable packages;
- Composer advisories: `0`.

The dependency-hardening work reduced the earlier WordPress meta-tooling baseline from 32 npm findings (`10 high`, `21 moderate`, `1 low`) to zero without `npm audit fix --force`, dependency overrides, or legacy peer-resolution bypasses.

The final Low advisory (`GHSA-g7r4-m6w7-qqqr`) was inherited through `@wordpress/components -> @wordpress/ui -> @wordpress/theme`, whose optional tooling peer kept `esbuild@0.27.x` in the npm graph. Production already consumes WordPress Components through the `wp-components` host handle, so installing a private npm copy was unnecessary. Removing that redundant local runtime dependency allowed the validated Vite line to resolve `esbuild@0.28.2`, which removes the advisory while preserving the production asset contract.

`security/npm-audit-baseline.json` now contains no allowed advisories. `npm run security:audit:dev-baseline` therefore fails if any advisory of any severity appears. The baseline remains ratcheting: dependency debt may decrease, but it cannot be silently reintroduced.

Runtime npm findings at Low or above and Composer advisories are unconditional hard failures.

## Reviewed npm install scripts

npm install-time lifecycle scripts are controlled through the project `allowScripts` policy and `.npmrc` enables `strict-allow-scripts=true`. The current graph requires exactly four reviewed lifecycle-script packages:

- `@parcel/watcher@2.6.0`
- `core-js@3.50.0`
- `esbuild@0.28.2`
- `fsevents@2.3.3`

`fsevents` is the macOS filesystem-watcher implementation. Approval is version-specific so a future native build change requires another review.

A dependency update that introduces a new install script or changes one of these approved versions must be reviewed and explicitly re-approved. CI fails rather than silently broadening the policy.

## Direct npm runtime dependencies

- `@dnd-kit/core`: `^6.3.1`
- `@dnd-kit/modifiers`: `^9.0.0`
- `@dnd-kit/sortable`: `^10.0.0`
- `@wordpress/api-fetch`: `7.41.0`
- `@wordpress/data`: `10.50.0`
- `@wordpress/element`: `8.2.0`
- `@wordpress/i18n`: `6.23.0`
- `@wordpress/icons`: `15.1.0`

`@wordpress/components` is intentionally not installed as an npm runtime dependency. Source imports are externalized to WordPress's `wp-components` script handle by the dependency-extraction plugin. Vitest resolves that host contract through the small adapter in `tests/js/wordpress-host/components.jsx` rather than reinstalling the entire Components dependency graph.

`@wordpress/compose`, `@wordpress/hooks`, and `@wordpress/url` are also WordPress host imports in source code. The production build externalizes them to WordPress handles; Vitest uses explicit host adapters so tests do not depend on accidental transitive npm installation.

`@wordpress/icons` is different: the dependency-extraction plugin does not externalize the icons package in this build, so it remains an explicit npm dependency and is bundled where needed.

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

## WordPress host adapters in tests

Vitest aliases only the WordPress packages that are intentionally host-provided and not guaranteed to exist in the npm graph:

- `@wordpress/components`
- `@wordpress/compose`
- `@wordpress/hooks`
- `@wordpress/url`

The adapters are deliberately small and test-only. They provide enough contract surface for module resolution and existing component tests; individual tests can still replace behavior with `vi.mock(...)`. Installed WordPress packages such as `@wordpress/element`, `@wordpress/i18n`, `@wordpress/api-fetch`, `@wordpress/data`, and `@wordpress/icons` continue to use their real npm modules in tests.

## License policy

The repository and plugin are `GPL-2.0-or-later`. `package.json` records that license explicitly.

`npm run check:licenses` starts from the project's direct `dependencies` and walks their installed `dependencies` and `optionalDependencies`. It intentionally does not treat development dependencies or external peer contracts as plugin runtime dependencies. Every reachable package must use a license accepted by the repository's GPLv2-compatible allowlist.

This distinction is important for the focused build stack: Sass, Vite, Webpack, and their build-only transitive packages are development tooling and are not mislabeled as distributed plugin runtime dependencies.

New runtime dependencies must therefore be both technically justified and license-compatible with the plugin distribution.

## Build-contract validation

The zero-advisory graph preserves the production build output and WordPress dependency handles. `build/admin.asset.php` continues to declare:

- `react`
- `react-dom`
- `react-jsx-runtime`
- `wp-api-fetch`
- `wp-components`
- `wp-element`
- `wp-i18n`
- `wp-primitives`

Current primary JavaScript sizes remain:

- `build/admin.js`: 90,629 bytes;
- `build/editor.js`: 13,894 bytes;
- `build/shared.js`: 15,990 bytes;
- primary total: 120,513 bytes.

All remain below the repository's existing bundle budgets. `editor.asset.php` and `shared.asset.php` also retain their existing WordPress handles, so removing the redundant npm Components copy does not change the WordPress runtime contract.

## CI and release gates

The permanent pipeline validates:

- deterministic `npm ci` with strict engine and install-script enforcement;
- Node.js/npm engine compatibility;
- exact reviewed install-script coverage;
- zero runtime npm advisories from Low severity upward;
- zero full-development npm advisories through the ratcheting baseline;
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
npm run security:audit
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

Security findings must be resolved through the dependency path that introduces them. Overrides require written justification, a narrowly scoped version range, and a clear removal condition; the current graph requires no security override.
