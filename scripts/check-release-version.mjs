import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const plugin = fs.readFileSync('virtual-media-folders.php', 'utf8');
const readme = fs.readFileSync('readme.txt', 'utf8');

const pluginVersion = plugin.match(/^\s*\*\s*Version:\s*([^\s]+)\s*$/m)?.[1];
const stableTag = readme.match(/^Stable tag:\s*([^\s]+)\s*$/mi)?.[1];
const packageVersion = pkg.version;

const values = {
	'package.json': packageVersion,
	'virtual-media-folders.php': pluginVersion,
	'readme.txt': stableTag,
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

const releaseTag = process.env.RELEASE_TAG;
if (releaseTag) {
	const tagVersion = releaseTag.replace(/^v/, '');
	if (tagVersion !== packageVersion) {
		console.error(`Release tag ${releaseTag} does not match plugin version ${packageVersion}.`);
		process.exit(1);
	}
}

console.log(`Release version is consistent: ${packageVersion}`);
