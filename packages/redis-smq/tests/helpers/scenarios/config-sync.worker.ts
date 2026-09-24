/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Child-process worker for `config-sync.ts`.
 *
 * Not a test file. Forked by the parent scenario helper; excluded
 * from the test glob by its `.worker.ts` suffix — the same convention
 * every other worker in this folder uses.
 *
 * Lifecycle:
 *   1. Receive the payload: `{ redisConfig, patch }`.
 *   2. Initialize RedisSMQ with the parent's config.
 *   3. Apply the `patch` via `ConfigManager.updateConfig`.
 *   4. Shut down RedisSMQ cleanly.
 *   5. Exit with code 0.
 *
 * The parent observes the effect by reading its own config after this
 * process exits. The write is durable as soon as `updateConfig`
 * resolves — the shutdown is a cleanliness step, not a flush.
 *
 * WHY A WORKER AND NOT AN IN-PROCESS `ConfigManager` CALL:
 *
 *   The point of the scenario is that the write crosses a process
 *   boundary. In-process, `updateConfig` writes to Redis and the
 *   same process's `getConfig()` reads from an in-memory cache it
 *   just updated — a test that only exercises that path would not
 *   verify that the write propagates to another process's cache.
 *
 *   Forking a child that writes, then reading from the parent after
 *   the child exits, is the cross-process verification.
 *
 * WHY THE PATCH IS A PARAMETER:
 *
 *   The parent chooses which config value to change; the worker
 *   applies it verbatim. A test that needs to verify a different
 *   config field passes a different patch without a new worker file.
 *   The specific value — `{ messageAudit: true }` in the reference
 *   test — is a test-suite concern, not a worker concern.
 *
 * WHY THE WORKER LOGS STEPS TO STDERR:
 *
 *   The parent helper (`syncConfigFromChild` in `config-sync.ts`)
 *   captures stderr and prints it when the child fails or times out.
 *   The step logs give the parent a breadcrumb if the child hangs
 *   at a specific phase — "it stopped after initialization" is more
 *   actionable than an empty stderr buffer.
 *
 *   On a successful run the child's stderr goes nowhere; the helper
 *   uses `silent: true` and resolves on exit code 0 without printing.
 *   The step logs only surface when they are useful.
 */

import type { IRedisConfig } from 'redis-smq-common';
import { RedisSMQ } from '../../../src/index.js';

// ---------------------------------------------------------------------------
// Payload
// ---------------------------------------------------------------------------

interface IPayload {
  redisConfig: IRedisConfig;
  /**
   * The config fields to change, as a partial. The shape is validated
   * only as "a plain object" here — RedisSMQ's `updateConfig`
   * performs the semantic validation (field names, value types).
   *
   * `Record<string, unknown>` is the honest type for a payload that
   * arrives over IPC as JSON: nothing more specific survives the
   * serialization round trip, and pretending otherwise would require
   * a runtime schema check the worker has no reason to implement.
   */
  patch: Record<string, unknown>;
}

function isPayload(value: unknown): value is IPayload {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.redisConfig === 'object' &&
    v.redisConfig !== null &&
    typeof v.patch === 'object' &&
    v.patch !== null
  );
}

// ---------------------------------------------------------------------------
// Environment guard
// ---------------------------------------------------------------------------

if (!process.send) {
  // The parent forks us; a missing IPC channel means we were invoked
  // directly, which is a misuse and would otherwise hang silently.
  console.error(
    '[config-sync.worker] not running as a forked child (no IPC channel); exiting',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Handshake
// ---------------------------------------------------------------------------

let handled = false;

process.on('message', (raw: unknown) => {
  // The parent sends exactly one payload. Ignore duplicates rather
  // than racing a second initialize / update.
  if (handled) return;
  handled = true;

  void handlePayload(raw).catch((err: unknown) => {
    console.error(
      '[config-sync.worker] failed:',
      err instanceof Error ? (err.stack ?? err.message) : err,
    );
    process.exit(1);
  });
});

// Safety net: if the parent dies before its timeout fires, do not
// linger indefinitely. The parent helper has a shorter timeout (15s),
// so this backstop only matters in the case where the parent itself
// has already exited. `unref` so this timer does not keep the event
// loop alive on its own.
setTimeout(() => {
  console.error('[config-sync.worker] safety timeout exceeded, exiting');
  process.exit(1);
}, 60_000).unref();

// ---------------------------------------------------------------------------
// Payload handler
// ---------------------------------------------------------------------------

async function handlePayload(raw: unknown): Promise<void> {
  if (!isPayload(raw)) {
    throw new Error(`invalid payload: ${JSON.stringify(raw)}`);
  }

  const { redisConfig, patch } = raw;

  await RedisSMQ.initialize(redisConfig);
  console.error('[config-sync.worker] step: RedisSMQ initialized');

  const configManager = RedisSMQ.createConfigManager();
  // The cast is required because `patch` arrives as
  // `Record<string, unknown>` over IPC. RedisSMQ's
  // `updateConfig` performs the semantic validation of the field
  // names and value types at runtime; a malformed patch would be
  // rejected there and surface through the top-level catch.
  await configManager.updateConfig(
    patch as Parameters<typeof configManager.updateConfig>[0],
  );
  console.error('[config-sync.worker] step: config updated');

  // Shut down RedisSMQ cleanly so the child's Redis connection is
  // released before exit. The write is already durable at this
  // point — `updateConfig` resolved only after the Redis round trip —
  // so the shutdown is a cleanliness step rather than a flush.
  await RedisSMQ.shutdown();
  console.error('[config-sync.worker] step: RedisSMQ shut down');

  // Exit with success. The parent's `exit` handler in
  // `syncConfigFromChild` resolves on code 0.
  process.exit(0);
}
