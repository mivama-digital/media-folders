# Dependency baseline

This file records the dependency baseline after the deterministic dependency migration.

## Runtime policy

- Node: >=24 <25
- npm: >=11 <12
- PHP: >=8.3
- JavaScript lockfile: package-lock.json (lockfileVersion 3)
- PHP lockfile: composer.lock
- Floating `latest` dependency specifications are prohibited.
- `npm audit fix --force` is prohibited.
- Major dependency upgrades must be isolated from feature changes.

## Current graph

- npm packages in lockfile: 1807
- npm vulnerabilities: 33 total (0 critical, 11 high, 21 moderate, 1 low)
- Composer advisories: 0

## Direct npm runtime dependencies

- `@dnd-kit/core`: `^6.3.1`
- `@dnd-kit/modifiers`: `^9.0.0`
- `@dnd-kit/sortable`: `^7.0.0`
- `@wordpress/api-fetch`: `7.41.0`
- `@wordpress/components`: `36.1.0`
- `@wordpress/data`: `10.50.0`
- `@wordpress/element`: `8.2.0`
- `@wordpress/i18n`: `6.23.0`
- `@wordpress/icons`: `15.1.0`

## Direct npm development dependencies

- `@testing-library/jest-dom`: `^6.9.1`
- `@testing-library/react`: `^14.0.0`
- `@testing-library/user-event`: `^14.6.1`
- `@vitejs/plugin-react`: `^5.1.2`
- `@wordpress/scripts`: `^32.6.0`
- `jsdom`: `^24.0.0`
- `react`: `^18.3.1`
- `react-dom`: `^18.3.1`
- `vitest`: `^4.0.18`

## Maintenance commands

```bash
npm run security:audit
npm run security:audit:high
npm run deps:outdated
npm run deps:tree
composer audit --locked
composer outdated --direct
```

Security findings must be resolved through the dependency path that introduces them. Overrides require documentation and a removal condition.
