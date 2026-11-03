/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import esmock from 'esmock';
import { resolve } from 'node:path';
import { vi, type Mock } from 'vitest';
import { getCurrentDir } from '../../../src/env/current-dir.js';

const currentDir = getCurrentDir();

export const modPath = resolve(currentDir, '../../../src/file-lock/index.js');
export const envPath = resolve(currentDir, '../../../src/env/index.js');

export type FileLockModule = typeof import('../../../src/file-lock/index.js');

export interface LoadOptions {
  /**
   * Override the stub used for `env.ensureDirectoryExists`.
   * Defaults to a resolved-promise spy. Pass your own `vi.fn()` when the
   * test needs to assert on call counts.
   */
  ensureDirectoryExists?: Mock;

  /**
   * Extra esmock overrides merged in after the built-in `env` and
   * `node:fs/promises` entries. Use this for `import:` mocks
   * (e.g. `{ import: { process: { once } } }`).
   */
  extraMocks?: Record<string, unknown>;
}

/**
 * Load `src/file-lock/index.js` with:
 *   - `node:fs/promises` replaced by `fsMocks`
 *   - `env.ensureDirectoryExists` replaced by `options.ensureDirectoryExists`
 *     (or a resolved-promise spy by default)
 *   - any extra esmock overrides from `options.extraMocks`
 *
 * The `env` path is resolved internally so callers never touch raw
 * module IDs — passing `'env'` or a relative path would make esmock fail
 * with `invalid moduleId`.
 */
export async function loadMockedFileLock(
  fsMocks: Record<string, Mock | unknown>,
  options: LoadOptions = {},
): Promise<FileLockModule> {
  const {
    ensureDirectoryExists = vi.fn().mockResolvedValue(undefined),
    extraMocks = {},
  } = options;

  return esmock<FileLockModule>(
    modPath,
    {},
    {
      'node:fs/promises': fsMocks,
      [envPath]: { env: { ensureDirectoryExists } },
      ...extraMocks,
    },
  );
}

/**
 * Poll `predicate()` until it returns true, or throw after `timeoutMs`.
 * Replaces the `bluebird.delay(5000)` pattern used by the original tests.
 */
export async function waitFor(
  predicate: () => boolean,
  timeoutMs = 3000,
  intervalMs = 20,
): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Condition not met within ${timeoutMs}ms`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
