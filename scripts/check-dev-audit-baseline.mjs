import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const baseline = JSON.parse(fs.readFileSync('security/npm-audit-baseline.json', 'utf8'));
const result = spawnSync('npm', ['audit', '--json'], {
	encoding: 'utf8',
	maxBuffer: 20 * 1024 * 1024,
});

if (!result.stdout?.trim()) {
	console.error(result.stderr || 'npm audit did not produce JSON output.');
	process.exit(1);
}

let report;
try {
	report = JSON.parse(result.stdout);
} catch (error) {
	console.error('Could not parse npm audit JSON output.');
	console.error(error);
	process.exit(1);
}

if (report.error) {
	console.error('npm audit returned an error payload:');
	console.error(JSON.stringify(report.error, null, 2));
	process.exit(1);
}

const counts = report.metadata?.vulnerabilities;
if (!counts) {
	console.error('npm audit JSON is missing metadata.vulnerabilities.');
	process.exit(1);
}

const countKeys = ['info', 'low', 'moderate', 'high', 'critical', 'total'];
let failed = false;

for (const key of countKeys) {
	const actual = Number(counts[key] ?? 0);
	const maximum = Number(baseline.maxCounts?.[key] ?? 0);
	console.log(`${key}: ${actual} (reviewed maximum ${maximum})`);
	if (actual > maximum) {
		console.error(`Audit count regression for ${key}: ${actual} > ${maximum}.`);
		failed = true;
	}
}

if (Number(counts.critical ?? 0) > 0) {
	console.error('Critical npm advisories are never permitted by the development baseline.');
	failed = true;
}

const allowedAdvisories = new Set(baseline.allowedAdvisories ?? []);
const seenAdvisories = new Set();

for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
	for (const via of vulnerability.via ?? []) {
		if (via && typeof via === 'object' && typeof via.url === 'string') {
			seenAdvisories.add(via.url);
		}
	}
}

const unknownAdvisories = [...seenAdvisories].filter((url) => !allowedAdvisories.has(url));
const resolvedAdvisories = [...allowedAdvisories].filter((url) => !seenAdvisories.has(url));

if (unknownAdvisories.length > 0) {
	console.error('Unreviewed npm advisories detected:');
	for (const url of unknownAdvisories.sort()) {
		console.error(`- ${url}`);
	}
	failed = true;
}

if (resolvedAdvisories.length > 0) {
	console.log('Previously reviewed advisories no longer present:');
	for (const url of resolvedAdvisories.sort()) {
		console.log(`- ${url}`);
	}
}

if (failed) {
	console.error('Development dependency audit exceeds the reviewed baseline.');
	process.exit(1);
}

console.log(`Development dependency audit is within the reviewed ${baseline.reviewedAt} baseline.`);
