/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { fork, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { env } from 'redis-smq-common';
import type { IQueueParams } from '../../../src/index.js';
import { redisConfig } from '../config/test-config.js';

/**
 * Parent-side API for the `consume-with-fixture` scenario.
 *
 * Forks `consume-with-fixture.worker.js`, sends it the Redis config,
 * a queue, and an absolute path to a handler fixture, and returns the
 * child handle. The caller is responsible for the child's lifetime —
 * kill it in a `finally` block.
 *
 * The caller usually subscribes to a bus event *before* calling this
 * function, so it can observe the child's outcome without needing the
 * child to signal anything through IPC. The returned child is for
 * cleanup, not for observation.
 *
 * WHY THE HANDLER PATH IS RESOLVED IN THE PARENT:
 *
 *   The caller supplies a bare fixture filename — `'ack.js'`,
 *   `'unack.js'`, etc. This helper resolves it to an absolute path
 *   before sending it to the child. The child runs in a forked
 *   process with its own working directory context, so a bare
 *   filename would be resolved against the wrong directory: the
 *   framework's file-based handler loader would look for `./ack.js`
 *   next to the child's entrypoint rather than under
 *   `helpers/fixtures/handlers/`, and reject with
 *   `MessageHandlerFileError`.
 *
 *   Resolving here also means the child does not need to know the
 *   parent's directory layout — it just receives an absolute path.
 *
 * WHY THE FIXTURE DIRECTORY IS `../fixtures/handlers/`:
 *
 *   `env.getCurrentDir()` returns this module's directory
 *   (`tests/helpers/scenarios/`). The fixtures live one level up, in
 *   `tests/helpers/fixtures/handlers/`. The `'../fixtures/handlers'`
 *   segment walks up and into that directory — the same pattern
 *   `crash-consumer.ts` uses to find its worker.
 */
export interface IConsumeWithFixtureOptions {
  queue: IQueueParams;
  /** Bare fixture filename, e.g. `'ack.js'`. */
  handlerFilename: `${string}.js`;
}

/**
 * Resolve a fixture filename to its absolute path.
 *
 * The `.js` extension is enforced by the template-literal type so a
 * caller who forgets it fails at compile time rather than at the
 * framework's `MessageHandlerFilenameExtensionError` at runtime.
 *
 * The returned path points into the *compiled* output tree (the
 * `dist/esm/tests/helpers/fixtures/handlers/` directory), because the
 * framework's file-based handler loader requires `.js` and does not
 * know about TypeScript sources. The build's `.ts → .js` compilation
 * places the fixture alongside its compiled siblings, so the path is
 * valid at test runtime.
 */
export function handlerFixturePath(filename: `${string}.js`): string {
  return path.resolve(env.getCurrentDir(), '../fixtures/handlers', filename);
}

export function consumeWithFixture(
  options: IConsumeWithFixtureOptions,
): ChildProcess {
  const workerPath = path.join(
    env.getCurrentDir(),
    'consume-with-fixture.worker.js',
  );
  const child = fork(workerPath, [], { silent: true });

  // Capture stderr so a failing child surfaces a useful message
  // rather than a bare exit code.
  let stderr = '';
  child.stderr?.on('data', (chunk: Buffer | string) => {
    stderr += String(chunk);
  });

  child.on('error', (err) => {
    console.error('[consume-with-fixture] child error:', err);
  });
  child.on('exit', (code, signal) => {
    // SIGKILL is the parent's own cleanup path. Any other non-zero
    // exit before the test finishes indicates a worker failure.
    if (signal !== 'SIGKILL' && code !== 0) {
      console.error(
        `[consume-with-fixture] child exited unexpectedly ` +
          `(code=${code}, signal=${signal}). stderr:\n${stderr || '(empty)'}`,
      );
    }
  });

  child.send({
    redisConfig,
    queue: options.queue,
    // Resolve the caller's bare filename to an absolute path before
    // handing it to the child. See the file header for why.
    handlerFilename: handlerFixturePath(options.handlerFilename),
  });

  return child;
}
