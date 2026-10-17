/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Package entry point.
 *
 * Re-exports the public surface from `src/index.ts`. This file exists
 * because the package's `package.json` `main`/`module`/`types` fields
 * resolve to `dist/index.js` and `dist/index.d.ts`, which compile from
 * here. Without it, every path in `package.json` would need to be
 * `./dist/src/index.js` — uglier, and it leaks the internal folder
 * layout to consumers who read the manifest.
 *
 * The public surface itself is defined entirely in `src/index.ts`.
 * That file is the single source of truth for what this package
 * exports. This file is a one-line redirect and should stay that way:
 * anything added here that isn't in `src/index.ts` becomes a second,
 * hidden public API that readers of `src/` won't find.
 */
export * from './src/index.js';
