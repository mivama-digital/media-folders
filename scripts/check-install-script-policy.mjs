import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const policy = pkg.allowScripts || {};

const installScriptPackages = [];
const uncovered = [];

for (const [path, entry] of Object.entries(lock.packages || {})) {
	if (!path || !entry?.hasInstallScript || !entry.version) {
		continue;
	}

	const marker = 'node_modules/';
	const markerIndex = path.lastIndexOf(marker);
	if (markerIndex === -1) {
		continue;
	}

	const name = path.slice(markerIndex + marker.length);
	const exactKey = `${name}@${entry.version}`;
	const decision = Object.prototype.hasOwnProperty.call(policy, exactKey)
		? policy[exactKey]
		: policy[name];

	installScriptPackages.push(exactKey);

	if (decision !== true && decision !== false) {
		uncovered.push(exactKey);
	}
}

const uniquePackages = [...new Set(installScriptPackages)].sort();
const uniqueUncovered = [...new Set(uncovered)].sort();

const staleExactEntries = Object.keys(policy)
	.filter((key) => key.includes('@') && key.lastIndexOf('@') > 0)
	.filter((key) => !uniquePackages.includes(key))
	.sort();

console.log(`Install-script packages in lockfile: ${uniquePackages.length}`);
for (const key of uniquePackages) {
	const at = key.lastIndexOf('@');
	const name = key.slice(0, at);
	const decision = Object.prototype.hasOwnProperty.call(policy, key)
		? policy[key]
		: policy[name];
	console.log(`- ${key}: ${decision === true ? 'approved' : decision === false ? 'denied' : 'unreviewed'}`);
}

if (uniqueUncovered.length > 0) {
	console.error('\nUnreviewed install-script dependencies:');
	for (const key of uniqueUncovered) {
		console.error(`- ${key}`);
	}
	process.exit(1);
}

if (staleExactEntries.length > 0) {
	console.error('\nStale exact allowScripts entries no longer match the lockfile:');
	for (const key of staleExactEntries) {
		console.error(`- ${key}`);
	}
	process.exit(1);
}

console.log('Install-script policy covers the complete locked graph.');
