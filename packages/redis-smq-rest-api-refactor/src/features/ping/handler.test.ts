/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { Deps } from '../../deps/index.js';
import { ping } from './handler.js';

/**
 * A `Deps` proxy that throws on any property access.
 *
 * If the handler under test reaches for `deps.logger`, `deps.queueManager`,
 * or any other field, the test fails immediately with a message naming
 * the field. This is the mechanism that enforces the "pure handler"
 * invariant without a linter rule or a convention.
 *
 * Typed as `Deps` so the assignment is compiler-checked — if `Deps`
 * gains a field, this proxy still satisfies the type (the `Proxy`
 * handler doesn't care about shape). If `Deps` loses a field, no
 * change is needed here.
 */
const emptyDeps = new Proxy({} as Deps, {
  get(_target, property) {
    throw new Error(
      `ping handler accessed deps.${String(property)}, but it must be dependency-free`,
    );
  },
});

describe('ping handler', () => {
  it('returns [200, { ok: true, uptime }]', async () => {
    const before = process.uptime();
    const [status, body] = await ping(emptyDeps, {
      path: {},
      query: {},
      body: undefined,
    });
    const after = process.uptime();

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(typeof body.uptime).toBe('number');
    // `process.uptime()` is monotonically non-decreasing, so the
    // returned value must fall within the window bracketing the call.
    expect(body.uptime).toBeGreaterThanOrEqual(before);
    expect(body.uptime).toBeLessThanOrEqual(after);
  });

  it('runs without touching any dependency', async () => {
    // The proxy throws on access. If the handler completes without
    // throwing, no dependency was read. This test is the same call as
    // the one above but reads as an assertion about the invariant
    // rather than about the response shape.
    await expect(
      ping(emptyDeps, { path: {}, query: {}, body: undefined }),
    ).resolves.toBeDefined();
  });
});
