/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { fork } from 'node:child_process';
import path from 'node:path';
import { env } from 'redis-smq-common';
import { redisConfig } from '../config/test-config.js';

/**
 * Fork a child that updates RedisSMQ's config and exits.
 *
 * The child receives the same Redis config as the parent plus a
 * `patch` — a partial config the child applies via its own
 * `ConfigManager`. The parent observes the effect by reading its own
 * config after the child exits.
 *
 * Resolves when the child exits with code 0. Rejects with the child's
 * stderr (if any) on any other exit, so a worker failure surfaces a
 * specific message rather than a bare timeout.
 *
 * WHY THE PATCH IS A PARAMETER:
 *
 *   The helper is a generic "run a config write in another process"
 *   primitive. A test chooses what to write; the helper handles the
 *   fork plumbing (stderr capture, timeout, exit-code check). Keeping
 *   the patch out of the helper means the same helper can serve
 *   future cross-process config tests without modification.
 *
 * WHY THE TIMEOUT IS 15 SECONDS:
 *
 *   A cold-forked child pays the full RedisSMQ initialization cost
 *   (Redis connection, pool warm-up, script loading) before it can
 *   write the config. On a loaded CI that has been observed at a few
 *   seconds; 15 seconds gives the child room to complete without
 *   extending the parent's test wall time excessively on the failure
 *   path.
 */
export interface ISyncConfigFromChildOptions {
  /**
   * The config fields to change, as a partial. The shape is not
   * validated here — RedisSMQ's `updateConfig` performs the
   * semantic validation (field names, value types) inside the child,
   * and a rejection surfaces through the child's exit code and
   * stderr.
   */
  patch: Record<string, unknown>;
}

export async function syncConfigFromChild(
  options: ISyncConfigFromChildOptions,
): Promise<void> {
  const workerPath = path.join(env.getCurrentDir(), 'config-sync.worker.js');

  await new Promise<void>((resolve, reject) => {
    const child = fork(workerPath, [], { silent: true });

    let stderr = '';
    child.stderr?.on('data', (chunk: Buffer | string) => {
      stderr += String(chunk);
    });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(
        new Error(
          `config-sync child did not exit within 15000ms. ` +
            `stderr:\n${stderr || '(empty)'}`,
        ),
      );
    }, 15_000);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('exit', (code, signal) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `config-sync child exited with code=${code} signal=${signal}. ` +
            `stderr:\n${stderr || '(empty)'}`,
        ),
      );
    });

    child.send({
      redisConfig,
      patch: options.patch,
    });
  });
}
