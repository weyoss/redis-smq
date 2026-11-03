/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import bluebird from 'bluebird';
import { resolve } from 'node:path';
import { env } from '../../../src/env/index.js';
import {
  CallableWorker,
  WorkerPayloadRequiredError,
} from '../../../src/worker/index.js';
import { getDummyLogger } from '../../../src/logger/index.js';

const dir = env.getCurrentDir();

function makeWorker(fixture: string) {
  return bluebird.promisifyAll(
    new CallableWorker<string | null, string>(
      resolve(dir, `./workers/${fixture}`),
      getDummyLogger(),
    ),
  );
}

describe('CallableWorker', () => {
  describe('happy path', () => {
    it('forwards the payload back through the callback', async () => {
      const worker = makeWorker('worker-ok.worker.js');
      await expect(worker.callAsync('Hello world!')).resolves.toBe(
        'Hello world!',
      );
      await worker.shutdownAsync();
    });

    it('rejects when the payload is null', async () => {
      const worker = makeWorker('worker-ok.worker.js');
      await expect(worker.callAsync(null)).rejects.toThrow(
        WorkerPayloadRequiredError,
      );
      await worker.shutdownAsync();
    });

    it('is idempotent on shutdown after a completed call', async () => {
      const worker = makeWorker('worker-ok.worker.js');
      // Call first so the worker reaches RUNNING; shutdown from IDLE leaves
      // the state machine in SHUTTING_DOWN after the callback fires and a
      // second shutdown() would reject with WorkerIsShuttingDownError.
      await worker.callAsync('Hello world!');
      await worker.shutdownAsync();
      await expect(worker.shutdownAsync()).resolves.toBeUndefined();
    });
  });

  describe('error propagation', () => {
    // `CallableWorker.callAsync` rejects with a `WorkerThreadError` whose
    // exit code lives in `error.metadata.code` (not `error.code`).
    const cases: Array<{ fixture: string; code: number; label: string }> = [
      {
        fixture: 'worker-non-existent.worker.js',
        code: 105,
        label: 'missing file',
      },
      {
        fixture: 'worker-non-existent.worker.jsc',
        code: 104,
        label: 'unsupported extension',
      },
      {
        fixture: 'worker-error.worker.js',
        code: 201,
        label: 'callback error',
      },
      {
        fixture: 'worker-exception.worker.js',
        code: 202,
        label: 'thrown exception',
      },
      {
        fixture: 'worker-faulty.worker.js',
        code: 101,
        label: 'no default export',
      },
      {
        fixture: 'worker-faulty-exit.worker.js',
        code: 333,
        label: 'worker self-exits at import',
      },
    ];

    it.each(cases)(
      'surfaces error $code for $label',
      async ({ fixture, code }) => {
        const worker = makeWorker(fixture);
        await expect(worker.callAsync('Hello world!')).rejects.toMatchObject({
          metadata: { code },
        });
        // Some fixtures have already torn down their thread; swallow a
        // shutdown error so the failure (if any) points at the call.
        await worker.shutdownAsync().catch(() => undefined);
      },
    );

    it('keeps rejecting on a subsequent call after a missing-file error', async () => {
      const worker = makeWorker('worker-non-existent.worker.js');
      await expect(worker.callAsync('Hello world!')).rejects.toMatchObject({
        metadata: { code: 105 },
      });
      await bluebird.delay(200);
      await expect(worker.callAsync('Hello world!')).rejects.toMatchObject({
        metadata: { code: 105 },
      });
    });
  });
});
