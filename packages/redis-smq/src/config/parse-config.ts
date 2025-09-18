/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQConfig, IRedisSMQParsedConfig } from './types/index.js';
import { parseNamespaceConfig } from './parse-namespace-config.js';
import { parseRedisConfig } from './parse-redis-config.js';
import { parseLoggerConfig } from './parse-logger-config.js';
import parseMessagesConfig from './parse-messages-config.js';
import { parseEventBusConfig } from './parse-event-bus-config.js';

export function parseConfig(config: IRedisSMQConfig): IRedisSMQParsedConfig {
  return {
    namespace: parseNamespaceConfig(config.namespace),
    redis: parseRedisConfig(config.redis),
    logger: parseLoggerConfig(config.logger),
    messages: parseMessagesConfig(config.messages),
    eventBus: parseEventBusConfig(config.eventBus),
  };
}
