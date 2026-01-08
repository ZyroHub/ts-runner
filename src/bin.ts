#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loaderPath = path.join(__dirname, 'index.js');
const loaderUrl = pathToFileURL(loaderPath).href;

const rawArgs = process.argv.slice(2);

const nodeWatchFlags = new Set(['--watch', '--watch-preserve-output']);

const nodeArgs = ['--loader', loaderUrl, '--no-warnings'];
const scriptArgs: string[] = [];

for (let i = 0; i < rawArgs.length; i++) {
	const arg = rawArgs[i];

	if (nodeWatchFlags.has(arg)) {
		nodeArgs.push(arg);
		continue;
	}

	if (arg === '--watch-path') {
		nodeArgs.push(arg);
		if (i + 1 < rawArgs.length) {
			nodeArgs.push(rawArgs[i + 1]);
			i++;
		}
		continue;
	}

	if (arg.startsWith('--watch-path=')) {
		nodeArgs.push(arg);
		continue;
	}

	scriptArgs.push(arg);
}

const child = spawn('node', [...nodeArgs, ...scriptArgs], {
	stdio: 'inherit',
	env: process.env
});

child.on('exit', code => process.exit(code ?? 0));
