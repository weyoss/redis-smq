/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import esmock from 'esmock';
import { EventEmitter } from 'node:events';
import { resolve } from 'node:path';
import { vi, type Mock, type MockInstance } from 'vitest';
import { env } from '../../../src/env/index.js';
import type { EWorkerType } from '../../../src/worker/index.js';

export interface MockedWorkerThread {
  parentPort: EventEmitter & { postMessage: Mock };
  mockExit: MockInstance<typeof process.exit>;
}

/**
 * Load the real `worker-thread` module with `worker_threads` mocked so its
 * top-level code executes against a synthetic parent port.
 *
 * Returns the synthetic port and the spied `process.exit` so callers can
 * assert on both sides of the wire.
 */
export async function mockWorkerThread(
  workerData: { filename?: string; type?: EWorkerType } | '',
): Promise<MockedWorkerThread> {
  const parentPort = new EventEmitter() as EventEmitter & {
    postMessage: Mock;
  };
  parentPort.postMessage = vi.fn();

  const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
    // Do not actually exit — this is what allows multi-exit paths to run.
  }) as never);

  await esmock(
    resolve(
      env.getCurrentDir(),
      '../../../src/worker/worker-thread/worker-thread.js',
    ),
    {},
    { worker_threads: { isMainThread: false, parentPort, workerData } },
  );

  return { parentPort, mockExit };
}

/**
 * Yield control for `ms` ms. Used for the pre-emit buffer only; all
 * post-emit waits should use `waitFor` so tests finish as soon as the
 * condition holds.
 */
export function settle(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Poll `predicate()` every 10ms until it returns true, or throw after
 * `timeoutMs`. Faster than a fixed delay when the condition holds early;
 * bounded when it doesn't.
 */
export async function waitFor(
  predicate: () => boolean,
  timeoutMs = 2000,
): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Condition not met within ${timeoutMs}ms`);
    }
    await new Promise((r) => setTimeout(r, 10));
  }
}
