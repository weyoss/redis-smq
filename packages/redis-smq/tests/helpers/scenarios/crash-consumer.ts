/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Simulate a consumer crashing mid-message.
 *
 * Forks a child process that:
 *   1. Initializes RedisSMQ with the test config.
 *   2. Produces a message to the target queue.
 *   3. Consumes it but deliberately never acks.
 *   4. Signals the parent once the message is in flight.
 *
 * The parent then sends SIGKILL, so the message is left in a "processing"
 * state with no acks. RedisSMQ's crash-recovery path (heartbeat
 * timeout → reap → requeue) is what subsequent assertions should observe.
 *
 * Handshake (messages travel over the IPC channel, not Redis):
 *
 *     child                          parent
 *     ─────                          ──────
 *     installs message handler
 *     ── 'ready' ─────────────────►
 *                                    sends { redisConfig, queue,
 *                                            consumerOptions, consumeOptions }
 *     ── 'consuming' ─────────────►
 *                                    SIGKILL
 *     exits (signal=SIGKILL)
 *                                    resolves
 *
 * Why the four-field payload:
 *
 *   The child is a separate process. `setDefaultConsumerOptions` and
 *   `setDefaultMessageConsumeOptions` configure RedisSMQ *in the
 *   current process* — they are not written to Redis, so a forked child
 *   cannot observe what the parent set. If the child produced a message
 *   using the library's built-in defaults, the message could differ from
 *   what the test expects: a different `retryThreshold` would change
 *   whether the crash produces a requeue or a dead-letter, and a non-zero
 *   `ttl` would let the message expire before the parent's recovery logic
 *   observed it.
 *
 *   The child's `isPayload` check requires all four fields. Sending fewer
 *   causes the child to reject the payload and exit non-zero, which the
 *   parent reports as "child exited before signalling readiness".
 *
 * Why SIGKILL and not SIGTERM:
 *
 *   SIGTERM is catchable. A consumer with a graceful-shutdown handler
 *   would release the in-flight message and requeue it cleanly, which
 *   defeats the point of the test — we want the crash-recovery path, not
 *   the graceful-shutdown path.
 */

import { fork, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { env } from 'redis-smq-common';
import { type IQueueParams, RedisSMQ } from '../../../src/index.js';
import { redisConfig } from '../config/test-config.js';
import { getDefaultQueue } from '../factories/queue.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ICrashConsumerOptions {
  /** Queue to produce and consume from. Defaults to the default test queue. */
  queue?: IQueueParams;
  /**
   * Upper bound on the whole handshake. Generous by default — CI machines
   * under load can take a few seconds just to fork and initialize.
   */
  timeoutMs?: number;
}

export async function crashAConsumerConsumingAMessage(
  options: ICrashConsumerOptions = {},
): Promise<void> {
  const queue = options.queue ?? getDefaultQueue();
  const timeoutMs = options.timeoutMs ?? 20_000;

  const workerPath = path.join(env.getCurrentDir(), 'crash-consumer.worker.js');
  const child = fork(workerPath, [], { silent: true });

  // Capture the child's stderr so a failure produces a useful message
  // rather than "child exited with code 1".
  let stderr = '';
  child.stderr?.on('data', (chunk: Buffer | string) => {
    stderr += String(chunk);
  });

  await runHandshake(child, queue, timeoutMs, () => stderr);
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

type TPhase = 'waiting-ready' | 'waiting-consuming' | 'killing' | 'settled';

function runHandshake(
  child: ChildProcess,
  queue: IQueueParams,
  timeoutMs: number,
  getStderr: () => string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let phase: TPhase = 'waiting-ready';
    let settled = false;

    // Build the rejection message *before* calling settle, so the phase
    // recorded in the message is the phase at the moment of failure, not
    // the 'settled' phase that settle assigns internally.
    const failWith = (
      reason: string,
      code: number | null,
      signal: string | null,
    ): void => {
      const err = new Error(
        `crash-consumer: ${reason} ` +
          `(phase="${phase}", code=${code}, signal=${signal}). ` +
          `Child stderr:\n${getStderr() || '(empty)'}`,
      );
      settle(() => reject(err));
    };

    const settle = (fn: () => void): void => {
      if (settled) return;
      settled = true;
      phase = 'settled';
      clearTimeout(timer);
      fn();
    };

    const timer = setTimeout(() => {
      // Best-effort cleanup. The child is about to be killed anyway; we
      // don't wait for exit here because the outer promise is rejecting.
      child.kill('SIGKILL');
      const err = new Error(
        `crash-consumer: timed out in phase "${phase}" after ${timeoutMs}ms. ` +
          `Child stderr:\n${getStderr() || '(empty)'}`,
      );
      settle(() => reject(err));
    }, timeoutMs);

    child.on('message', (msg: unknown) => {
      if (msg === 'ready' && phase === 'waiting-ready') {
        phase = 'waiting-consuming';
        // Send all four fields the child's `isPayload` check requires.
        // `ProducibleMessage.getDefaultConsumeOptions()` and
        // `RedisSMQ.getDefaultConsumerOptions()` read the parent's
        // current runtime settings, which `applyTestDefaults()` set in
        // `beforeEach`.
        child.send({
          redisConfig,
          queue,
          consumerOptions: RedisSMQ.getDefaultConsumerOptions(),
          consumeOptions: RedisSMQ.getDefaultMessageConsumeOptions(),
        });
        return;
      }
      if (msg === 'consuming' && phase === 'waiting-consuming') {
        phase = 'killing';
        child.kill('SIGKILL');
        return;
      }
      // Any other message is a protocol violation on the worker side.
      const err = new Error(
        `crash-consumer: unexpected message from child in phase "${phase}": ` +
          `${JSON.stringify(msg)}`,
      );
      settle(() => reject(err));
    });

    child.on('error', (err) => {
      settle(() => reject(err));
    });

    child.on('exit', (code, signal) => {
      if (phase === 'killing' && signal === 'SIGKILL') {
        settle(resolve);
        return;
      }
      if (phase === 'waiting-ready' || phase === 'waiting-consuming') {
        failWith('child exited before signalling readiness', code, signal);
        return;
      }
      // Should not reach here: `settled` guards re-entry, and the timeout
      // path settles before we see the exit. Defensive.
      failWith('child exited after settle', code, signal);
    });
  });
}
