import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const plugin = fs.readFileSync('virtual-media-folders.php', 'utf8');
const readme = fs.readFileSync('readme.txt', 'utf8');
const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');

const packageVersion = pkg.version;
const lockVersion = lock.version;
const lockRootVersion = lock.packages?.['']?.version;
const pluginHeaderVersion = plugin.match(/^\s*\*\s*Version:\s*([^\s]+)\s*$/m)?.[1];
const pluginConstantVersion = plugin.match(/define\(\s*'VMFO_VERSION',\s*'([^']+)'\s*\);/)?.[1];
const stableTag = readme.match(/^Stable tag:\s*([^\s]+)\s*$/mi)?.[1];

const values = {
	'package.json': packageVersion,
	'package-lock.json': lockVersion,
	'package-lock.json root package': lockRootVersion,
	'virtual-media-folders.php header': pluginHeaderVersion,
	'virtual-media-folders.php VMFO_VERSION': pluginConstantVersion,
	'readme.txt stable tag': stableTag,
};

for (const [source, version] of Object.entries(values)) {
	if (!version) {
		throw new Error(`Could not read release version from ${source}.`);
	}
}

const uniqueVersions = new Set(Object.values(values));
if (uniqueVersions.size !== 1) {
	console.error('Release version mismatch:');
	for (const [source, version] of Object.entries(values)) {
		console.error(`- ${source}: ${version}`);
	}
	process.exit(1);
}

const changelogHeading = `## [${packageVersion}]`;
if (!changelog.includes(changelogHeading)) {
	console.error(`CHANGELOG.md does not contain ${changelogHeading}.`);
	process.exit(1);
}

const wpReadmeHeading = `= ${packageVersion} =`;
if (!readme.includes(wpReadmeHeading)) {
	console.error(`readme.txt changelog does not contain ${wpReadmeHeading}.`);
	process.exit(1);
}

const releaseTag = process.env.RELEASE_TAG;
if (releaseTag) {
	const tagVersion = releaseTag.replace(/^v/, '');
	if (tagVersion !== packageVersion) {
		console.error(`Release tag ${releaseTag} does not match plugin version ${packageVersion}.`);
		process.exit(1);
	}
}

console.log(`Release version is consistent across package, lockfile, plugin, readme, and changelog: ${packageVersion}`);
