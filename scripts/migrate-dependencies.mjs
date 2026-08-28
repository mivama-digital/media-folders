import fs from 'node:fs';

const packagePath = new URL('../package.json', import.meta.url);
const lockPath = new URL('../package-lock.json', import.meta.url);

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

const pinLatest = (groupName) => {
  const group = pkg[groupName] || {};
  for (const [name, spec] of Object.entries(group)) {
    if (spec !== 'latest') continue;
    const resolved = lock.packages?.[`node_modules/${name}`]?.version;
    if (!resolved) {
      throw new Error(`Cannot resolve locked version for ${name}`);
    }
    group[name] = resolved;
  }
};

pinLatest('dependencies');
pinLatest('devDependencies');

// Upgrade security-sensitive toolchains in explicit compatibility waves.
pkg.devDependencies['@wordpress/scripts'] = '^34.2.0';
pkg.devDependencies['@testing-library/dom'] = '^10.4.1';
pkg.devDependencies['@testing-library/jest-dom'] = '^7.0.1';
pkg.devDependencies['@testing-library/react'] = '^16.3.2';
pkg.devDependencies['@testing-library/user-event'] = '^14.6.6';
// plugin-react 6 requires Vite 8. Keep the latest compatible Vite 7 line.
pkg.devDependencies['@vitejs/plugin-react'] = '^5.1.4';
pkg.devDependencies.jsdom = '^30.0.1';
pkg.devDependencies.vitest = '^4.1.11';

// Keep the DnD packages as one runtime compatibility wave.
pkg.dependencies['@dnd-kit/core'] = '^6.3.1';
pkg.dependencies['@dnd-kit/modifiers'] = '^9.0.0';
pkg.dependencies['@dnd-kit/sortable'] = '^10.0.0';

pkg.engines = {
  ...(pkg.engines || {}),
  node: '>=24 <25',
  npm: '>=11 <12',
};

pkg.packageManager = 'npm@11.17.0';
pkg.scripts = {
  ...pkg.scripts,
  'security:audit': 'npm audit',
  'security:audit:high': 'npm audit --audit-level=high',
  'security:audit:runtime': 'npm audit --omit=dev --audit-level=high',
  'deps:outdated': 'npm outdated',
  'deps:tree': 'npm ls --all',
};

fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, '\t')}\n`);
