#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loaderPath = path.join(__dirname, 'index.js');
const loaderUrl = pathToFileURL(loaderPath).href;

const args = process.argv.slice(2);

const child = spawn('node', ['--loader', loaderUrl, '--no-warnings', ...args], {
	stdio: 'inherit',
	env: process.env
});

child.on('exit', code => process.exit(code ?? 0));
