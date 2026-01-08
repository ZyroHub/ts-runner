import fs from 'fs';
import { getTsconfig } from 'get-tsconfig';
import path from 'path';

const tsconfig = getTsconfig();
const paths = tsconfig?.config.compilerOptions?.paths || {};
const baseUrl = tsconfig?.config.compilerOptions?.baseUrl || '.';

const tsconfigDir = tsconfig?.path ? path.dirname(tsconfig.path) : process.cwd();

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

export function resolvePathAlias(specifier: string): string | null {
	for (const alias in paths) {
		const prefix = alias.replace(/\*$/, '');

		if (specifier.startsWith(prefix)) {
			const replacements = paths[alias];
			if (!replacements || replacements.length === 0) continue;

			const target = replacements[0].replace(/\*$/, '');
			const suffix = specifier.replace(prefix, '');

			const resolvedPath = path.resolve(tsconfigDir, baseUrl, target, suffix);

			if (resolvedPath.endsWith('.js')) {
				const tsPath = resolvedPath.replace(/\.js$/, '.ts');
				if (fs.existsSync(tsPath)) return tsPath;

				const tsxPath = resolvedPath.replace(/\.js$/, '.tsx');
				if (fs.existsSync(tsxPath)) return tsxPath;
			}

			for (const ext of extensions) {
				const pathWithExt = resolvedPath + ext;
				if (fs.existsSync(pathWithExt)) {
					return pathWithExt;
				}
			}

			if (fs.existsSync(resolvedPath)) {
				const stat = fs.statSync(resolvedPath);
				if (stat.isDirectory()) {
					for (const ext of extensions) {
						const indexPath = path.join(resolvedPath, `index${ext}`);
						if (fs.existsSync(indexPath)) {
							return indexPath;
						}
					}
				}
				return resolvedPath;
			}
		}
	}

	return null;
}
