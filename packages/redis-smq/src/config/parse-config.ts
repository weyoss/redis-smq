/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQConfig, IRedisSMQParsedConfig } from './types/index.js';
import { parseNamespaceConfig } from './parse-namespace-config.js';
import { parseRedisConfig } from './parse-redis-config.js';
import { parseLoggerConfig } from './parse-logger-config.js';
import { parseMessageAuditConfig } from './parse-message-audit-config.js';
import { parseEventBusConfig } from './parse-event-bus-config.js';

export function parseConfig(config: IRedisSMQConfig): IRedisSMQParsedConfig {
  return {
    namespace: parseNamespaceConfig(config.namespace),
    redis: parseRedisConfig(config.redis),
    logger: parseLoggerConfig(config.logger),
    messageAudit: parseMessageAuditConfig(config.messageAudit),
    eventBus: parseEventBusConfig(config.eventBus),
  };
}
