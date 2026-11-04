/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import esmock from 'esmock';
import { resolve } from 'node:path';
import { env } from '../../../src/env/index.js';
import type { ICallback } from '../../../src/async/index.js';
import type { IRunnableWorker } from '../../../src/worker/index.js';
import {
  EWorkerThreadChildExecutionCode,
  EWorkerThreadChildExitCode,
  EWorkerThreadParentMessage,
  type TWorkerThreadParentMessage,
} from '../../../src/worker/index.js';

const dir = env.getCurrentDir();
const modulePath = resolve(
  dir,
  '../../../src/worker/worker-thread/runnable-worker-thread.js',
);
const messageModulePath = resolve(
  dir,
  '../../../src/worker/worker-thread/worker-thread-message.js',
);

type TPort = EventEmitter;

interface TestContext {
  handleRunnableWorker: (
    worker: unknown,
    port: unknown,
    initialPayload: unknown,
  ) => void;
  exit: ReturnType<typeof vi.fn>;
  port: TPort;
}

/**
 * Load `handleRunnableWorker` with `exit` from `worker-thread-message.js`
 * replaced by a spy.
 *
 * The real `exit` calls `process.exit(code)` after `postMessage`, which
 * would terminate the test process. The spy is a **no-op** (does not throw)
 * so we can observe exactly how many times `exit` was called — this is the
 * signal that catches the missing-`return` bug: without the fix, execution
 * falls through to the next error branch and calls `exit` twice for one
 * logical failure.
 */
async function loadHandler(): Promise<TestContext> {
  const exit = vi.fn();
  const mod = await esmock<{
    handleRunnableWorker: TestContext['handleRunnableWorker'];
  }>(
    modulePath,
    {},
    {
      [messageModulePath]: { exit },
    },
  );
  const port = new EventEmitter();
  return { handleRunnableWorker: mod.handleRunnableWorker, exit, port };
}

function emit(port: TPort, msg: TWorkerThreadParentMessage): void {
  port.emit('message', msg);
}

function createInstance(): IRunnableWorker & {
  run: ReturnType<typeof vi.fn>;
  shutdown: ReturnType<typeof vi.fn>;
} {
  return {
    run: vi.fn((cb: ICallback<void>) => cb(null)),
    shutdown: vi.fn((cb: ICallback<void>) => cb(null)),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Worker type detection
// ═══════════════════════════════════════════════════════════════════════════

describe('handleRunnableWorker — worker type detection', () => {
  it('invokes a native ES6 class with `new`', async () => {
    const { handleRunnableWorker, exit, port } = await loadHandler();

    class MyWorker implements IRunnableWorker {
      static constructed = false;
      static lastPayload: unknown = null;

      constructor(payload: unknown) {
        MyWorker.constructed = true;
        MyWorker.lastPayload = payload;
      }
      run(cb: ICallback<void>): void {
        cb(null);
      }
      shutdown(cb: ICallback<void>): void {
        cb(null);
      }
    }

    handleRunnableWorker(MyWorker, port, 'the-payload');

    // A class called without `new` throws "cannot be invoked without new",
    // which would land in the catch block and call exit(). Asserting both
    // no-exit and constructor-ran proves `new MyWorker(...)` was used.
    expect(exit).not.toHaveBeenCalled();
    expect(MyWorker.constructed).toBe(true);
    expect(MyWorker.lastPayload).toBe('the-payload');
  });

  it('invokes a regular function factory without `new`', async () => {
    const { handleRunnableWorker, exit, port } = await loadHandler();
    const instance = createInstance();

    // Regression: before the fix, `isWorkerClass` checked
    // `Worker.prototype.constructor === 'function'`, which is true for
    // EVERY non-arrow function — so this factory was invoked as
    // `new factory(payload)`. `new.target` distinguishes the two paths:
    //   - `new factory()` → new.target === factory (truthy)
    //   - `factory()`     → new.target === undefined
    let calledWithNew: boolean | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function factory(_payload: unknown): IRunnableWorker {
      calledWithNew = new.target !== undefined;
      return instance;
    }

    handleRunnableWorker(factory, port, 'payload');

    expect(exit).not.toHaveBeenCalled();
    expect(calledWithNew).toBe(false);
  });

  it('invokes an arrow function factory without `new`', async () => {
    const { handleRunnableWorker, exit, port } = await loadHandler();
    const instance = createInstance();

    // Arrow functions have no prototype — the old check happened to work
    // for them (Worker.prototype is undefined → falsy), but the asymmetry
    // was accidental. This test documents the expected behavior going
    // forward so a future change to isWorkerClass doesn't accidentally
    // route arrow factories through the class branch.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const arrowFactory = (_payload: unknown): IRunnableWorker => instance;

    handleRunnableWorker(arrowFactory, port, 'payload');

    expect(exit).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Invalid worker type
// ═══════════════════════════════════════════════════════════════════════════

describe('handleRunnableWorker — invalid worker type', () => {
  it('exits exactly once when the factory throws', async () => {
    const { handleRunnableWorker, exit, port } = await loadHandler();
    const error = new Error('factory blew up');

    function factory(): IRunnableWorker {
      throw error;
    }

    handleRunnableWorker(factory, port, 'payload');

    // Regression: without the `return` after exit(), execution fell
    // through to the instance-validation block, which (seeing
    // `instance === null`) called exit() a second time.
    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(
      EWorkerThreadChildExitCode.INVALID_WORKER_TYPE,
      error,
    );
  });

  it('exits exactly once when the factory returns null', async () => {
    const { handleRunnableWorker, exit, port } = await loadHandler();

    handleRunnableWorker(() => null, port, 'payload');

    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(
      EWorkerThreadChildExitCode.INVALID_WORKER_TYPE,
    );
  });

  it('exits exactly once when the factory returns a primitive', async () => {
    const { handleRunnableWorker, exit, port } = await loadHandler();

    // `new primitiveReturningFactory()` discards the primitive and returns
    // `this` — the old misclassification would have silently wrapped this
    // case into a broken `this` object. With the fix, the factory is
    // called normally and its primitive return trips the validation.
    handleRunnableWorker(() => 42, port, 'payload');

    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(
      EWorkerThreadChildExitCode.INVALID_WORKER_TYPE,
    );
  });

  it('exits exactly once when the instance is missing run()', async () => {
    const { handleRunnableWorker, exit, port } = await loadHandler();

    handleRunnableWorker(() => ({ shutdown: vi.fn() }), port, 'payload');

    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(
      EWorkerThreadChildExitCode.INVALID_WORKER_TYPE,
    );
  });

  it('exits exactly once when the instance is missing shutdown()', async () => {
    const { handleRunnableWorker, exit, port } = await loadHandler();

    handleRunnableWorker(() => ({ run: vi.fn() }), port, 'payload');

    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(
      EWorkerThreadChildExitCode.INVALID_WORKER_TYPE,
    );
  });

  it('does not install a message listener after an invalid worker', async () => {
    const { handleRunnableWorker, port } = await loadHandler();

    handleRunnableWorker(() => null, port, 'payload');

    // Regression: without the `return` after the second exit(), execution
    // reached `messagePort.on('message', onMessage)`. Emitting a RUN
    // message would then fire the handler with `instance === null` and
    // throw a TypeError (caught → exit with PROCESSING_CAUGHT_ERROR).
    // With the fix, no listener is installed and emit is a no-op.
    expect(port.listenerCount('message')).toBe(0);
  });

  it('installs exactly one message listener for a valid worker', async () => {
    const { handleRunnableWorker, port } = await loadHandler();
    const instance = createInstance();

    handleRunnableWorker(() => instance, port, 'payload');

    expect(port.listenerCount('message')).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RUN message
// ═══════════════════════════════════════════════════════════════════════════

describe('handleRunnableWorker — RUN message', () => {
  it('invokes instance.run with a callback', async () => {
    const { handleRunnableWorker, exit, port } = await loadHandler();
    const instance = createInstance();

    handleRunnableWorker(() => instance, port, 'payload');
    emit(port, { type: EWorkerThreadParentMessage.RUN });

    expect(instance.run).toHaveBeenCalledTimes(1);
    expect(instance.run).toHaveBeenCalledWith(expect.any(Function));
    expect(exit).not.toHaveBeenCalled();
  });

  it('exits with PROCESSING_CAUGHT_ERROR when run() throws synchronously', async () => {
    const { handleRunnableWorker, exit, port } = await loadHandler();
    const error = new Error('run blew up');
    const instance: IRunnableWorker = {
      run: vi.fn(() => {
        throw error;
      }),
      shutdown: vi.fn(),
    };

    handleRunnableWorker(() => instance, port, 'payload');
    emit(port, { type: EWorkerThreadParentMessage.RUN });

    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(
      EWorkerThreadChildExecutionCode.PROCESSING_CAUGHT_ERROR,
      error,
    );
  });

  it('exits with PROCESSING_ERROR when run() callback receives an error', async () => {
    const { handleRunnableWorker, exit, port } = await loadHandler();
    const error = new Error('async run failed');
    const instance: IRunnableWorker = {
      run: vi.fn((cb: ICallback<void>) => cb(error)),
      shutdown: vi.fn(),
    };

    handleRunnableWorker(() => instance, port, 'payload');
    emit(port, { type: EWorkerThreadParentMessage.RUN });

    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(
      EWorkerThreadChildExecutionCode.PROCESSING_ERROR,
      error,
    );
  });

  it('does not exit when run() callback succeeds', async () => {
    const { handleRunnableWorker, exit, port } = await loadHandler();
    const instance = createInstance();

    handleRunnableWorker(() => instance, port, 'payload');
    emit(port, { type: EWorkerThreadParentMessage.RUN });

    expect(exit).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SHUTDOWN message
// ═══════════════════════════════════════════════════════════════════════════

describe('handleRunnableWorker — SHUTDOWN message', () => {
  it('invokes instance.shutdown with a callback', async () => {
    const { handleRunnableWorker, exit, port } = await loadHandler();
    const instance = createInstance();

    handleRunnableWorker(() => instance, port, 'payload');
    emit(port, { type: EWorkerThreadParentMessage.SHUTDOWN });

    expect(instance.shutdown).toHaveBeenCalledTimes(1);
    expect(instance.shutdown).toHaveBeenCalledWith(expect.any(Function));
    expect(exit).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Message routing
// ═══════════════════════════════════════════════════════════════════════════

describe('handleRunnableWorker — message routing', () => {
  it('ignores CALL messages (runnable workers do not handle request-response)', async () => {
    const { handleRunnableWorker, port } = await loadHandler();
    const instance = createInstance();

    handleRunnableWorker(() => instance, port, 'payload');
    emit(port, {
      type: EWorkerThreadParentMessage.CALL,
      payload: 'ignored',
    });

    expect(instance.run).not.toHaveBeenCalled();
    expect(instance.shutdown).not.toHaveBeenCalled();
  });

  it('routes multiple messages independently', async () => {
    const { handleRunnableWorker, port } = await loadHandler();
    const instance = createInstance();

    handleRunnableWorker(() => instance, port, 'payload');
    emit(port, { type: EWorkerThreadParentMessage.RUN });
    emit(port, { type: EWorkerThreadParentMessage.SHUTDOWN });
    emit(port, { type: EWorkerThreadParentMessage.RUN });

    expect(instance.run).toHaveBeenCalledTimes(2);
    expect(instance.shutdown).toHaveBeenCalledTimes(1);
  });
});
