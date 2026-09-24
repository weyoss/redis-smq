/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Vitest `setupFiles` entry point.
 *
 * Loaded once per worker process by Vitest before any test file runs.
 * Composes two hook modules:
 *
 *   - `./global.js`    — once-per-worker sanity check, warm-up, teardown.
 *   - `./per-test.js`  — per-test reset (mocks, Redis data, RedisSMQ,
 *                        config defaults, async-error surfacing).
 *
 * Both are imported for their side effects. This file exists so that
 * `vitest.config.ts` has a single `setupFiles` entry to reference and so
 * the composition is visible in one place.
 *
 * ORDERING MATTERS:
 *
 *   `global.js` is imported first. Its `beforeAll` must run before any
 *   test's `beforeEach` because it establishes the "RedisSMQ is
 *   initialized with the test config" precondition that `per-test.js`
 *   relies on. If the imports were reversed, `per-test.js`'s warm-up
 *   would race the initialization.
 */

import './global.js';
import './per-test.js';
