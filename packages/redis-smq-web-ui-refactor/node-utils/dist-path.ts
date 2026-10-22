/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { env } from 'redis-smq-common';
import path from 'node:path';

/**
 * Absolute path to the directory that holds the built SPA assets.
 *
 * The build produces:
 *
 *   dist/
 *     browser/                        ← this directory (vite output)
 *     node/
 *       cjs/node-utils/dist-path.js
 *       esm/node-utils/dist-path.js
 *
 * The SPA is served by pointing a static handler at this path:
 *
 *   app.use(express.static(getDistPath()));
 *
 * @returns The absolute path to `dist/browser/`.
 */
export function getDistPath(): string {
  // `env.getCurrentDir()` returns the directory of the file that calls
  // it — at runtime that is `dist/node/{esm,cjs}/node-utils/`. Three
  // levels up lands on `dist/`, and `browser` is a sibling of `node/`.
  return path.resolve(env.getCurrentDir(), '../../../browser');
}
