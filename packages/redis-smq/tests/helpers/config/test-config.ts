/**
 * Test configuration — the single source of truth for:
 *
 *   1. `redisConfig` — how tests connect to Redis. Read at module load time
 *      from `REDIS_HOST` / `REDIS_PORT` env vars, which are set by
 *      `tests/setup/global-setup.ts` (embedded Redis) or by CI / a developer
 *      (external Redis).
 *
 *   2. `testConfig` — the parsed RedisSMQ configuration applied to every
 *      test via `applyTestDefaults()` in `tests/helpers/config/test-defaults.ts`.
 *
 * Both are consumed across the setup files and by tests that need to reach
 * Redis directly. Do not duplicate the values elsewhere; import from here.
 *
 * Why this is a module and not a factory:
 *   `redisConfig` is read by forked workers at import time. Vitest's
 *   globalSetup cannot export values to workers directly — the supported
 *   channel is `process.env`, which the parent's forked children inherit.
 *   A module-level constant read once from env is the correct shape.
 */

import { ERedisConfigClient, type IRedisConfig } from 'redis-smq-common';
import { parseConfig } from '../../../src/core/config-manager/parse-config.js';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/**
 * Namespace used by every test. Exported so tests and helpers can reference
 * it instead of hardcoding the string 'testing'. Changing this in one place
 * changes it everywhere.
 */
export const TEST_NAMESPACE = 'testing';

const REDIS_HOST = process.env.REDIS_HOST ?? '127.0.0.1';
const REDIS_PORT = parsePort(process.env.REDIS_PORT, 6379);
const REDIS_DB = 1;

// ---------------------------------------------------------------------------
// Redis connection config
// ---------------------------------------------------------------------------

/**
 * Connection config used by tests and by the pool.
 *
 * The port is read from `REDIS_PORT`, which `global-setup.ts` sets to the
 * port of the embedded server it just started. If `REDIS_PORT` is preset
 * externally (CI, local override), the embedded server is skipped and this
 * config points at the external instance.
 */
export const redisConfig: IRedisConfig = {
  client: ERedisConfigClient.IOREDIS,
  options: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: REDIS_DB,
    showFriendlyErrorStack: true,
  },
};

// ---------------------------------------------------------------------------
// RedisSMQ config
// ---------------------------------------------------------------------------

/**
 * Test-wide RedisSMQ configuration.
 *
 * `applyTestDefaults()` writes this via `createConfigManager().updateConfig()`
 * before every test, so tests that mutate the config (there are several —
 * they exercise audit flags, expiry, queue size limits) cannot leak into
 * the next test.
 *
 * `logger.enabled: false` keeps the test output focused on failures. Flip
 * to `true` with a `logLevel` of `'DEBUG'` locally when you need to see what
 * the library is doing.
 */
export const testConfig = parseConfig({
  namespace: TEST_NAMESPACE,
  logger: {
    enabled: false,
    options: {
      logLevel: 'DEBUG',
    },
  },
  messageAudit: {
    acknowledgedMessages: true,
    deadLetteredMessages: true,
    unacknowledgementHistory: true,
  },
});

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Parse a port from an env var, falling back to `fallback` if unset or
 * invalid. Unlike the old `Number(x) || 6379` idiom, this does not treat
 * `0` as a "missing" value — though `0` is not a meaningful port for our
 * tests, silently rewriting it to 6379 masked configuration mistakes.
 */
function parsePort(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
