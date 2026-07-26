<div align="center">
    <img src="https://i.imgur.com/KVVR2dM.png">
</div>

## ZyroHub - TS Runner

<p>This is the TypeScript runner module of the ZyroHub ecosystem, allowing you to compile and execute TypeScript files on the fly with full decorator metadata and path alias support.</p>

## Table of Contents

- [ZyroHub - TS Runner](#zyrohub---ts-runner)
- [Table of Contents](#table-of-contents)
- [Getting Started](#getting-started)
	- [TypeScript Configuration](#typescript-configuration)
- [Basic Usage](#basic-usage)
	- [Running a File](#running-a-file)
	- [Watch Mode](#watch-mode)
- [Path Aliases](#path-aliases)
- [Why @zyrohub/ts-runner?](#why-zyrohubts-runner)

## Getting Started

To install the TS runner, use one of the following package managers:

[NPM Repository](https://www.npmjs.com/package/@zyrohub/ts-runner)

```bash
# npm
npm install @zyrohub/ts-runner
# yarn
yarn add @zyrohub/ts-runner
# pnpm
pnpm add @zyrohub/ts-runner
# bun
bun add @zyrohub/ts-runner
```

### TypeScript Configuration

⚠️ **Important:** To use the Dependency Injection system (such as in `@zyrohub/core`), you **must** enable `emitDecoratorMetadata` and `experimentalDecorators` in your `tsconfig.json`.

```json
{
	"compilerOptions": {
		"experimentalDecorators": true,
		"emitDecoratorMetadata": true
	}
}
```

## Basic Usage

### Running a File

To run a TypeScript file on the fly, use the `ztsc` executable followed by your entry file:

```bash
ztsc index.ts
```

### Watch Mode

To run a file in development mode and watch for changes, use the `--watch` option:

```bash
ztsc --watch index.ts
```

This will automatically restart the execution whenever any of the imported TypeScript files change.

## Path Aliases

The runner automatically resolves path aliases defined in your `tsconfig.json` (`paths` and `baseUrl`). 

For example, if you have the following `tsconfig.json`:

```json
{
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"@/*": ["src/*"]
		}
	}
}
```

You can import files using your aliases (even specifying `.js` extensions as required by ESM):

```typescript
import { MyService } from '@/services/MyService.js';
```

The runner will locate the file at `src/services/MyService.ts` and resolve the import seamlessly.

## Why @zyrohub/ts-runner?

Compared to other runners like `tsx` or `ts-node`:

- **Decorator Metadata Support:** Unlike `tsx` (which utilizes `esbuild` and does not support `emitDecoratorMetadata` out of the box), `@zyrohub/ts-runner` compiles code using SWC configured to output decorator metadata correctly. This is crucial for frameworks that rely on Dependency Injection like `@zyrohub/core`.
- **Fast Execution:** Unlike `ts-node` (which can be slow on larger projects), `@zyrohub/ts-runner` compiles files instantly using `@swc/core`.
- **Seamless ESM Integration:** Fully supports ES Module imports, including `.js` extensions pointing to `.ts` files, without requiring configuration tweaks.
