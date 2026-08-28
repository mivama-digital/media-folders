import fs from 'node:fs';

const budgets = {
	'build/admin.js': 112_640,
	'build/shared.js': 24_576,
	'build/editor.js': 24_576,
};

let total = 0;
let failed = false;

for (const [file, maxBytes] of Object.entries(budgets)) {
	if (!fs.existsSync(file)) {
		console.error(`Missing bundle: ${file}`);
		failed = true;
		continue;
	}

	const bytes = fs.statSync(file).size;
	total += bytes;
	console.log(`${file}: ${bytes} bytes (budget ${maxBytes})`);

	if (bytes > maxBytes) {
		console.error(`${file} exceeds its bundle budget by ${bytes - maxBytes} bytes.`);
		failed = true;
	}
}

const totalBudget = 163_840;
console.log(`Primary JS total: ${total} bytes (budget ${totalBudget})`);
if (total > totalBudget) {
	console.error(`Primary JS total exceeds its bundle budget by ${total - totalBudget} bytes.`);
	failed = true;
}

if (failed) {
	process.exit(1);
}
