/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IRedisSMQConfig } from 'redis-smq';

/**
 * Fixture-level values shared across the web server test suite.
 *
 * Three categories of configuration exist in the test environment:
 *
 *   1. **Process-level** — which port Redis listens on, which host it
 *      binds to. These are not known until `spawnRedis()` runs and are
 *      managed by `redis-server.ts`. Nothing here touches them.
 *
 *   2. **Server-level** — the `RedisSMQWebServer` config object. Its
 *      Redis connection and its listening port are both dynamic
 *      (embedded Redis, ephemeral port) and are assembled by
 *      `start-web-server.ts`. Nothing here touches those either.
 *
 *   3. **Fixture-level** — values that tests share but that don't
 *      depend on the runtime environment: the default base path every
 *      test assumes, the redis-smq library config the suite applies
 *      before each test, and the constants that go with them. **This
 *      file.**
 */

/**
 * The `basePath` the shared setup uses for the web server.
 *
 * Kept as a constant so the setup file, the SPA tests that assert on
 * `window.configs.BASE_PATH`, and any future URL-composition helpers
 * all agree. A change here propagates to every test that depends on
 * the shared server's base path; tests that need a different base
 * path construct their own server (see `base-path.test.ts`).
 */
export const TEST_BASE_PATH = '/';

/**
 * Library-level `redis-smq` configuration applied before each test.
 *
 * Passed to `RedisSMQ.createConfigManager().updateConfig(...)` in the
 * setup file. This configures the runtime the embedded REST API
 * builds inside the web server — it is not the web server's own
 * config, and it is not the Redis connection config.
 *
 * `messageAudit: true` enables the audit trail the message-history
 * endpoints depend on, so tests that exercise the embedded REST API
 * through the web server can hit them without additional setup.
 * `logger.enabled: false` keeps test output clean.
 */
export const TEST_REDIS_SMQ_CONFIG: IRedisSMQConfig = {
  logger: {
    enabled: false,
    options: {
      logLevel: 'DEBUG',
    },
  },
  messageAudit: true,
};
