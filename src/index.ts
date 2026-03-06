import { transform } from '@swc/core';
import { existsSync, readFileSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

import { resolvePathAlias } from './paths.js';

// @ts-ignore
const originalResolveFilename = Module._resolveFilename;

// @ts-ignore
Module._resolveFilename = function (request, parent, isMain, options) {
	if (request.endsWith('.js') && (request.startsWith('.') || request.startsWith('/'))) {
		const tsPath = path.resolve(path.dirname(parent?.filename || ''), request.replace(/\.js$/, '.ts'));
		if (existsSync(tsPath)) return tsPath;

		const tsxPath = tsPath + 'x';
		if (existsSync(tsxPath)) return tsxPath;
	}
	return originalResolveFilename.apply(this, arguments);
};

// @ts-ignore
Module._extensions['.ts'] = function (module, filename) {
	const source = readFileSync(filename, 'utf8');
	const output = transformSync(source, filename);
	module._compile(output, filename);
};

function transformSync(source: string, filename: string) {
	const { transformSync: swcTransform } = require('@swc/core');
	return swcTransform(source, {
		filename,
		jsc: {
			parser: { syntax: 'typescript', decorators: true, tsx: filename.endsWith('.tsx') },
			target: 'esnext',
			transform: { legacyDecorator: true, decoratorMetadata: true }
		},
		module: { type: 'commonjs' }
	}).code;
}

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
