import fs from 'node:fs';
import path from 'node:path';

const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

// Keep this list deliberately narrow. It mirrors the GPLv2-compatible license
// families accepted by WordPress build tooling, but the check itself is local
// so the repository does not need the full @wordpress/scripts meta-package.
const compatibleLicenses = new Set([
	'0BSD',
	'Apache-2.0 WITH LLVM-exception',
	'Artistic-2.0',
	'BlueOak-1.0.0',
	'BSD',
	'BSD-2-Clause',
	'BSD-3-Clause',
	'BSD-3-Clause-W3C',
	'CC-BY-4.0',
	'CC0-1.0',
	'GPL-2.0',
	'GPL-2.0+',
	'GPL-2.0-or-later',
	'ISC',
	'LGPL-2.1',
	'MIT',
	'MIT-0',
	'MIT/X11',
	'MPL-2.0',
	'ODC-By-1.0',
	'Public Domain',
	'Unlicense',
	'W3C-20150513',
	'WTFPL',
	'Zlib',
]);

function hasBalancedOuterParens(value) {
	if (!value.startsWith('(') || !value.endsWith(')')) {
		return false;
	}

	let depth = 0;
	for (let index = 0; index < value.length; index += 1) {
		const character = value[index];
		if (character === '(') {
			depth += 1;
		} else if (character === ')') {
			depth -= 1;
			if (depth === 0 && index !== value.length - 1) {
				return false;
			}
		}
		if (depth < 0) {
			return false;
		}
	}

	return depth === 0;
}

function stripOuterParens(value) {
	let result = value.trim();
	while (hasBalancedOuterParens(result)) {
		result = result.slice(1, -1).trim();
	}
	return result;
}

function splitTopLevel(value, operator) {
	const parts = [];
	let depth = 0;
	let start = 0;

	for (let index = 0; index <= value.length - operator.length; index += 1) {
		const character = value[index];
		if (character === '(') {
			depth += 1;
		} else if (character === ')') {
			depth -= 1;
		}

		if (depth === 0 && value.slice(index, index + operator.length) === operator) {
			parts.push(value.slice(start, index).trim());
			start = index + operator.length;
			index += operator.length - 1;
		}
	}

	if (parts.length === 0) {
		return [value.trim()];
	}

	parts.push(value.slice(start).trim());
	return parts;
}

function isCompatibleExpression(expression) {
	const normalized = stripOuterParens(String(expression || '').trim());
	if (!normalized) {
		return false;
	}

	const orParts = splitTopLevel(normalized, ' OR ');
	if (orParts.length > 1) {
		return orParts.some(isCompatibleExpression);
	}

	const andParts = splitTopLevel(normalized, ' AND ');
	if (andParts.length > 1) {
		return andParts.every(isCompatibleExpression);
	}

	return compatibleLicenses.has(normalized);
}

function packageNameFromLockPath(lockPath) {
	const marker = 'node_modules/';
	const index = lockPath.lastIndexOf(marker);
	return index === -1 ? lockPath : lockPath.slice(index + marker.length);
}

function readInstalledLicense(lockPath) {
	const packageJsonPath = path.join(lockPath, 'package.json');
	if (!fs.existsSync(packageJsonPath)) {
		return null;
	}

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
	const rawLicense =
		packageJson.license ??
		(packageJson.licenses
			? packageJson.licenses.map((item) => item?.type ?? item).join(' OR ')
			: null);

	return typeof rawLicense === 'object' ? rawLicense?.type ?? null : rawLicense;
}

const incompatible = [];
const checked = [];

for (const [lockPath, entry] of Object.entries(lock.packages || {})) {
	if (!lockPath || entry?.dev === true) {
		continue;
	}

	const name = entry?.name || packageNameFromLockPath(lockPath);
	const license = entry?.license || readInstalledLicense(lockPath);
	checked.push(`${name}@${entry?.version || 'unknown'}`);

	if (!license || !isCompatibleExpression(license)) {
		incompatible.push({
			name,
			version: entry?.version || 'unknown',
			license: license || 'missing',
		});
	}
}

console.log(`GPLv2-compatible runtime license check: ${checked.length} packages inspected.`);

if (incompatible.length > 0) {
	console.error('Incompatible or unknown runtime dependency licenses:');
	for (const dependency of incompatible.sort((a, b) => a.name.localeCompare(b.name))) {
		console.error(`- ${dependency.name}@${dependency.version}: ${dependency.license}`);
	}
	process.exit(1);
}

console.log('All runtime dependency licenses are GPLv2-compatible.');
