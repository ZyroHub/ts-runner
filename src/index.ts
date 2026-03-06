import { transform } from '@swc/core';
import { readFileSync, existsSync } from 'fs';
import fs from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

import { resolvePathAlias } from './paths.js';

const require = createRequire(import.meta.url);
const Module = require('module');

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
	if (request.endsWith('.js') && (request.startsWith('.') || request.startsWith('/'))) {
		const parentDir = parent?.filename ? path.dirname(parent.filename) : process.cwd();
		const tsPath = path.resolve(parentDir, request.replace(/\.js$/, '.ts'));

		if (existsSync(tsPath)) return tsPath;

		const tsxPath = tsPath + 'x';
		if (existsSync(tsxPath)) return tsxPath;
	}
	return originalResolveFilename.apply(this, [request, parent, isMain, options]);
};

Module._extensions['.ts'] = function (module: any, filename: string) {
	const source = readFileSync(filename, 'utf8');
	const { transformSync } = require('@swc/core');

	const output = transformSync(source, {
		filename,
		jsc: {
			parser: { syntax: 'typescript', decorators: true, tsx: filename.endsWith('.tsx') },
			target: 'esnext',
			transform: { legacyDecorator: true, decoratorMetadata: true }
		},
		module: { type: 'commonjs' }
	});

	module._compile(output.code, filename);
};

export async function resolve(specifier: string, context: any, nextResolve: any) {
	const aliasPath = resolvePathAlias(specifier);
	if (aliasPath) {
		return {
			url: pathToFileURL(aliasPath).href,
			shortCircuit: true,
			format: aliasPath.endsWith('.json') ? 'json' : 'module'
		};
	}

	if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('file:')) {
		const url = new URL(specifier, context.parentURL).href;
		const targetPath = fileURLToPath(url);

		if (targetPath.endsWith('.js')) {
			const tsPath = targetPath.replace(/\.js$/, '.ts');
			try {
				await fs.stat(tsPath);
				return { url: pathToFileURL(tsPath).href, shortCircuit: true, format: 'module' };
			} catch {
				const tsxPath = targetPath.replace(/\.js$/, '.tsx');
				try {
					await fs.stat(tsxPath);
					return { url: pathToFileURL(tsxPath).href, shortCircuit: true, format: 'module' };
				} catch {}
			}
		}
	}
	return nextResolve(specifier, context);
}

export async function load(url: string, context: any, nextLoad: any) {
	if (url.endsWith('.ts') || url.endsWith('.tsx')) {
		const filePath = fileURLToPath(url);
		const source = await fs.readFile(filePath, 'utf8');
		const output = await transform(source, {
			filename: filePath,
			jsc: {
				parser: { syntax: 'typescript', decorators: true, tsx: url.endsWith('.tsx') },
				target: 'esnext',
				transform: { legacyDecorator: true, decoratorMetadata: true }
			},
			module: { type: 'es6' },
			sourceMaps: 'inline'
		});
		return { format: 'module', source: output.code, shortCircuit: true };
	}
	return nextLoad(url, context);
}
