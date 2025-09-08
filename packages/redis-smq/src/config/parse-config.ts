/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQConfig, IRedisSMQParsedConfig } from './types/index.js';
import { getNamespaceConfig } from './get-namespace-config.js';
import { getRedisConfig } from './get-redis-config.js';
import { getLoggerConfig } from './get-logger-config.js';
import getMessagesConfig from './get-messages-config.js';
import { getEventBusConfig } from './get-event-bus-config.js';

export function parseConfig(config: IRedisSMQConfig): IRedisSMQParsedConfig {
  return {
    namespace: getNamespaceConfig(config),
    redis: getRedisConfig(config),
    logger: getLoggerConfig(config),
    messages: getMessagesConfig(config),
    eventBus: getEventBusConfig(config),
  };
}
