import { transform } from '@swc/core';
import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

import { resolvePathAlias } from './paths.js';

export async function resolve(specifier: string, context: any, nextResolve: any) {
	const aliasPath = resolvePathAlias(specifier);
	if (aliasPath) {
		return {
			url: pathToFileURL(aliasPath).href,
			shortCircuit: true,
			format: 'module'
		};
	}

	if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('file:')) {
		let targetPath = specifier.startsWith('file:') ? fileURLToPath(specifier) : specifier;

		if (specifier.startsWith('.')) {
			const parentPath = fileURLToPath(context.parentURL);
			const parentDir = path.dirname(parentPath);
			targetPath = path.resolve(parentDir, specifier);
		}

		if (targetPath.endsWith('.js')) {
			try {
				await fs.stat(targetPath);
			} catch {
				const tsPath = targetPath.replace(/\.js$/, '.ts');
				try {
					await fs.stat(tsPath);
					return {
						url: pathToFileURL(tsPath).href,
						shortCircuit: true,
						format: 'module'
					};
				} catch {
					const tsxPath = targetPath.replace(/\.js$/, '.tsx');
					try {
						await fs.stat(tsxPath);
						return {
							url: pathToFileURL(tsxPath).href,
							shortCircuit: true,
							format: 'module'
						};
					} catch {}
				}
			}
		}

		if (!targetPath.endsWith('.ts') && !targetPath.endsWith('.js')) {
			try {
				await fs.stat(targetPath + '.ts');
				return {
					url: pathToFileURL(targetPath + '.ts').href,
					shortCircuit: true,
					format: 'module'
				};
			} catch {
				try {
					const stat = await fs.stat(targetPath);
					if (stat.isDirectory()) {
						const indexTs = path.join(targetPath, 'index.ts');
						await fs.stat(indexTs);
						return {
							url: pathToFileURL(indexTs).href,
							shortCircuit: true,
							format: 'module'
						};
					}
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
				parser: {
					syntax: 'typescript',
					decorators: true,
					tsx: url.endsWith('.tsx')
				},
				target: 'esnext',
				transform: {
					legacyDecorator: true,
					decoratorMetadata: true
				}
			},
			module: {
				type: 'es6'
			},
			sourceMaps: 'inline'
		});

		return {
			format: 'module',
			source: output.code,
			shortCircuit: true
		};
	}

	return nextLoad(url, context);
}
