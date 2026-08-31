import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const baseline = JSON.parse(fs.readFileSync('security/npm-audit-baseline.json', 'utf8'));
const severityRank = {
	info: 0,
	low: 1,
	moderate: 2,
	high: 3,
	critical: 4,
};

if (baseline.schemaVersion !== 2) {
	console.error(`Unsupported npm audit baseline schema: ${baseline.schemaVersion}`);
	process.exit(1);
}

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

const allowedAdvisories = new Map(Object.entries(baseline.allowedAdvisories ?? {}));
const seenAdvisories = new Map();

for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
	for (const via of vulnerability.via ?? []) {
		if (via && typeof via === 'object' && typeof via.url === 'string') {
			const severity = typeof via.severity === 'string' ? via.severity.toLowerCase() : vulnerability.severity;
			const previous = seenAdvisories.get(via.url);
			if (!previous || (severityRank[severity] ?? 99) > (severityRank[previous] ?? 99)) {
				seenAdvisories.set(via.url, severity);
			}
		}
	}
}

for (const [url, actualSeverity] of [...seenAdvisories.entries()].sort(([a], [b]) => a.localeCompare(b))) {
	const allowedSeverity = allowedAdvisories.get(url);
	if (!allowedSeverity) {
		console.error(`Unreviewed npm advisory detected: ${url} (${actualSeverity}).`);
		failed = true;
		continue;
	}

	if ((severityRank[actualSeverity] ?? 99) > (severityRank[allowedSeverity] ?? -1)) {
		console.error(`Severity regression for ${url}: ${actualSeverity} exceeds reviewed ${allowedSeverity}.`);
		failed = true;
	}
}

const resolvedAdvisories = [...allowedAdvisories.keys()].filter((url) => !seenAdvisories.has(url));
if (resolvedAdvisories.length > 0) {
	console.error('Reviewed advisories have disappeared. Ratchet the baseline down before merging:');
	for (const url of resolvedAdvisories.sort()) {
		console.error(`- ${url}`);
	}
	failed = true;
}

if (failed) {
	console.error('Development dependency audit does not match the reviewed baseline.');
	process.exit(1);
}

console.log(`Development dependency audit exactly matches the reviewed ${baseline.reviewedAt} advisory set and stays within its severity/count ceilings.`);
