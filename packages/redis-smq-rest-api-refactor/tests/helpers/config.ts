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
 * The `basePath` every HTTP test assumes.
 *
 * `start-api.ts` uses this as the default when it constructs the
 * server config, and tests compose URLs as `${apiUrl}${TEST_BASE_PATH}/...`.
 * Keeping it as a constant means a change here propagates to every
 * test and to the server that serves them — they cannot disagree.
 */
export const TEST_BASE_PATH = '/';

/**
 * Library-level redis-smq configuration applied before each test.
 *
 * Passed to `RedisSMQ.createConfigManager().updateConfig(...)` in the
 * setup file. This config affects every manager the API server
 * constructs — it is not the REST API's own config, and it is not the
 * Redis connection config.
 *
 * The values here mirror the original package's test configuration.
 * `logger.enabled: false` keeps test output clean; `messageAudit: true`
 * enables the audit trail that the message-history endpoints depend on.
 * A test that needs a different library config can call
 * `updateConfig` itself with a partial override — `redis-smq` merges
 * the change over the current config.
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
