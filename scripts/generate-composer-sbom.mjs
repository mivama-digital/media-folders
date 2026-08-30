import fs from 'node:fs';

const composer = JSON.parse(fs.readFileSync('composer.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('composer.lock', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// composer/installers is required to preserve the wordpress-plugin installation
// contract for Composer/VCS consumers, but it is installation tooling rather than
// executable plugin runtime code and is deliberately excluded from the WordPress
// distribution archive.
const installationOnlyPackages = new Set([
	'composer/installers',
]);

const runtimePackages = (lock.packages || []).filter(
	(entry) => !installationOnlyPackages.has(entry.name)
);
const refs = new Map(runtimePackages.map((entry) => [entry.name, `pkg:composer/${entry.name}@${entry.version}`]));
const rootRef = `pkg:composer/${composer.name}@${pkg.version}`;

const components = runtimePackages.map((entry) => ({
	'bom-ref': refs.get(entry.name),
	type: 'library',
	name: entry.name,
	version: entry.version,
	purl: refs.get(entry.name),
	licenses: Array.isArray(entry.license)
		? entry.license.map((license) => ({ license: { name: license } }))
		: [],
}));

const runtimeRequirements = (requirements = {}) => Object.keys(requirements)
	.filter((name) => !name.startsWith('php') && !name.startsWith('ext-') && refs.has(name))
	.map((name) => refs.get(name));

const dependencies = [
	{
		ref: rootRef,
		dependsOn: runtimeRequirements(composer.require),
	},
	...runtimePackages.map((entry) => ({
		ref: refs.get(entry.name),
		dependsOn: runtimeRequirements(entry.require),
	})),
];

const sbom = {
	'$schema': 'https://cyclonedx.org/schema/bom-1.5.schema.json',
	bomFormat: 'CycloneDX',
	specVersion: '1.5',
	version: 1,
	metadata: {
		timestamp: new Date().toISOString(),
		component: {
			'bom-ref': rootRef,
			type: 'application',
			name: composer.name,
			version: pkg.version,
			purl: rootRef,
		},
		properties: [
			{
				name: 'mivama:php-runtime-vendor-policy',
				value: 'vendor-free; composer/installers is installation-only and excluded from distribution',
			},
		],
	},
	components,
	dependencies,
};

process.stdout.write(`${JSON.stringify(sbom, null, 2)}\n`);
