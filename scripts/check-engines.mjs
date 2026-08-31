import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

function parseMajorRange(range, label) {
	const match = String(range || '').match(/^>=(\d+)\s+<(\d+)$/);
	if (!match) {
		throw new Error(`Unsupported ${label} engine range: ${range}`);
	}

	return {
		min: Number(match[1]),
		maxExclusive: Number(match[2]),
	};
}

function assertMajor(version, range, label) {
	const major = Number(String(version).split('.')[0]);
	if (!Number.isInteger(major)) {
		throw new Error(`Unable to parse ${label} version: ${version}`);
	}

	if (major < range.min || major >= range.maxExclusive) {
		throw new Error(
			`${label} ${version} does not satisfy >=${range.min} <${range.maxExclusive}.`
		);
	}

	console.log(`${label} ${version}: compatible`);
}

const nodeRange = parseMajorRange(pkg.engines?.node, 'Node.js');
const npmRange = parseMajorRange(pkg.engines?.npm, 'npm');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmVersion = execFileSync(npmCommand, ['--version'], {
	encoding: 'utf8',
}).trim();

assertMajor(process.versions.node, nodeRange, 'Node.js');
assertMajor(npmVersion, npmRange, 'npm');
