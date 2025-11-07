/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  ERedisConfigClient,
  IConsoleLoggerOptions,
  ILoggerConfig,
  IRedisConfig,
} from 'redis-smq-common';
import { IMessageAuditParsedConfig, IMessageAuditConfig } from '../../index.js';

export interface IEventBusConfig {
  enabled?: boolean;
}

export interface IRedisSMQConfig {
  /**
   * Logical namespace for all queues, exchanges, and Redis keys used by RedisSMQ.
   *
   * Purpose:
   * - Isolates resources between applications/environments.
   * - Used whenever an operation does not explicitly pass a namespace.
   *
   * Defaults:
   * - If omitted, the default namespace is used (see defaultConfig.namespace).
   */
  namespace?: string;

  /**
   * @see /packages/redis-smq-common/docs/api/interfaces/IRedisConfig.md
   */
  redis?: IRedisConfig;

  /**
   * @see /packages/redis-smq-common/docs/api/interfaces/ILoggerConfig.md
   */
  logger?: ILoggerConfig;

  /**
   * Message audit configuration for tracking processed messages.
   *
   * Message audit creates dedicated Redis storage to track processed message IDs,
   * enabling efficient monitoring and analysis of acknowledged and dead-lettered
   * messages per queue. Without message audit, QueueAcknowledgedMessages and
   * QueueDeadLetteredMessages classes cannot function.
   *
   * **Storage Impact:**
   * - Creates separate Redis storage structures for tracked message IDs
   * - Default settings use unlimited storage and retention (queueSize: 0, expire: 0)
   * - Consider setting limits in production to manage Redis memory usage
   *
   * **Configuration Options:**
   * - `true`: Enable audit for both acknowledged and dead-lettered messages with defaults
   * - `false` or `undefined`: Disable message audit completely
   * - `IMessageAuditConfig`: Enable with granular control over message types and limits
   *
   * @example
   * ```typescript
   * // Enable audit for all processed messages (unlimited storage)
   * const config = {
   *   messageAudit: true
   * };
   *
   * // Enable audit only for dead-lettered messages
   * const config = {
   *   messageAudit: {
   *     deadLetteredMessages: true
   *   }
   * };
   *
   * // Enable audit with storage limits
   * const config = {
   *   messageAudit: {
   *     acknowledgedMessages: {
   *       queueSize: 5000,        // track last 5,000 message IDs per queue
   *       expire: 12 * 60 * 60    // retain for 12 hours
   *     },
   *     deadLetteredMessages: {
   *       queueSize: 10000,       // track last 10,000 message IDs per queue
   *       expire: 7 * 24 * 60 * 60 // retain for 7 days
   *     }
   *   }
   * };
   * ```
   *
   * @see {@link /packages/redis-smq/docs/message-audit.md} for detailed documentation
   * @see {@link IMessageAuditConfig} for configuration interface details
   */
  messageAudit?: boolean | IMessageAuditConfig;

  /**
   * @see /packages/redis-smq/docs/event-bus.md
   */
  eventBus?: IEventBusConfig;
}

export interface IRedisSMQParsedConfig
  extends Required<Omit<IRedisSMQConfig, 'messageAudit'>> {
  messageAudit: IMessageAuditParsedConfig;
  eventBus: Required<IEventBusConfig>;
}

export interface IRedisSMQDefaultConfig extends IRedisSMQParsedConfig {
  redis: {
    client: ERedisConfigClient.IOREDIS;
    options: {
      host: string;
      port: number;
      db: number;
    };
  };
  logger: {
    enabled: boolean;
    options: Required<IConsoleLoggerOptions>;
  };
}
