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
  'deps:outdated': 'npm outdated',
  'deps:tree': 'npm ls --all',
};

fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, '\t')}\n`);
