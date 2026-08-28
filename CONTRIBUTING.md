# Contributing

## Branching

Use short-lived branches from `main`:

- `feature/<name>` for features;
- `fix/<name>` for bug fixes;
- `refactor/<name>` for internal changes;
- `chore/<name>` for maintenance.

Direct feature development on `main` is discouraged.

## Local setup

Requirements:

- Node.js 24+
- npm
- PHP 8.3+
- Composer 2

Install dependencies:

```bash
npm ci
composer install
```

## Required checks

Before opening or updating a pull request, run:

```bash
npm test -- --run
composer test
npm run build
```

Generated build files that are intentionally tracked must be updated together with their source changes.

## Pull requests

A pull request should:

- describe the problem and the chosen solution;
- stay focused on one coherent change;
- include or update tests for behavioral changes;
- call out WordPress, PHP, accessibility, migration, or compatibility risks;
- identify relevant upstream commits when porting upstream work;
- avoid unrelated formatting or generated-file churn.

## Upstream-derived changes

When adopting work from `soderlind/virtual-media-folders`, preserve authorship and license information. Prefer a traceable cherry-pick when the upstream commit applies cleanly. When reimplementing a change, reference the relevant upstream commit or pull request in the Mivama pull request description.

See [UPSTREAM.md](UPSTREAM.md) for the maintenance policy.

## Releases

Release changes are reviewed separately from normal feature work. Do not deploy to WordPress.org merely by creating a Git tag. WordPress.org deployment requires an explicit release action and configured Mivama-owned credentials.