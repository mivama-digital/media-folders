import fs from 'node:fs';

const requestedVersion = process.argv[2];
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = requestedVersion ?? pkg.version;

if (!/^\d+\.\d+\.\d+(?:[-.][0-9A-Za-z.-]+)?$/.test(version)) {
	console.error(`Invalid release version: ${version}`);
	process.exit(1);
}

const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
const heading = `## [${version}]`;
const start = changelog.indexOf(heading);

if (start === -1) {
	console.error(`CHANGELOG.md does not contain ${heading}.`);
	process.exit(1);
}

const contentStart = start + heading.length;
const remainder = changelog.slice(contentStart);
const nextHeading = remainder.search(/^## \[/m);
const rawSection = nextHeading === -1 ? remainder : remainder.slice(0, nextHeading);
const notes = rawSection.replace(/^\s*[-–—]?\s*\d{4}-\d{2}-\d{2}\s*$/m, '').trim();

if (!notes) {
	console.error(`CHANGELOG.md section ${heading} has no release notes.`);
	process.exit(1);
}

process.stdout.write(`${notes}\n`);
