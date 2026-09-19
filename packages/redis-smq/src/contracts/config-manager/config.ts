/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ILoggerConfig } from 'redis-smq-common';
import { ILoggerParsedConfig } from './logger.js';
import {
  IMessageAuditConfig,
  IMessageAuditParsedConfig,
} from './message-audit.js';

/**
 * Configuration for a RedisSMQ instance.
 *
 * Every field is optional. Fields that are omitted fall back to a
 * default, and the resulting configuration is normalized into a
 * `IRedisSMQParsedConfig` before the library uses it.
 *
 * Configuration is process-wide — every component reads from the same
 * resolved configuration object. It is stored in Redis and shared
 * across processes; a change made in one process propagates to the
 * others via the configuration sync mechanism.
 *
 * @example
 * const config: IRedisSMQConfig = {
 *   namespace: 'production',
 *   logger: { enabled: true, options: { logLevel: EConsoleLoggerLevel.INFO } },
 *   messageAudit: {
 *     acknowledgedMessages: { enabled: true, queueSize: 5000 },
 *   },
 * };
 */
export interface IRedisSMQConfig {
  /**
   * Logical namespace for the queues, exchanges, and Redis keys this
   * instance manages.
   *
   * Purpose:
   *   - Isolates resources between applications and environments.
   *   - Serves as the default namespace for any operation that does not
   *     specify one.
   *
   * A namespace is a short lowercase string. It is used as a segment in
   * every Redis key the library writes, so it must satisfy the
   * library's key-validity rules: start with a letter, contain only
   * letters, digits, and the characters `-`, `_`, and `.`.
   *
   * Defaults to `'default'` when omitted.
   *
   * @example
   * // Two deployments sharing one Redis instance
   * const app1 = { namespace: 'billing' };
   * const app2 = { namespace: 'shipping' };
   */
  namespace?: string;

  /**
   * Logger configuration.
   *
   * Accepts:
   *   - `true`: enable logging with the default options
   *   - `false`: disable logging entirely
   *   - `ILoggerConfig`: enable with granular control
   *
   * The library uses the provided logger configuration for every
   * component that emits diagnostics — consumers, producers, managers,
   * background workers. See the `redis-smq-common` package for the
   * full `ILoggerConfig` interface.
   *
   * Defaults to disabled.
   */
  logger?: boolean | ILoggerConfig;

  /**
   * Message audit configuration.
   *
   * Message audit creates dedicated Redis storage that tracks processed
   * message IDs, enabling efficient monitoring and analysis of
   * acknowledged and dead-lettered messages per queue. Without message
   * audit, `QueueAcknowledgedMessages` and `QueueDeadLetteredMessages`
   * cannot function — they raise `AcknowledgmentAuditDisabledError` and
   * `DeadLetterAuditDisabledError` respectively.
   *
   * Storage impact:
   *   - Creates separate Redis structures for tracked message IDs.
   *   - Default settings use unlimited storage and retention
   *     (`queueSize: 0`, `expire: 0`).
   *   - For production deployments, set `queueSize` and `expire` on
   *     each category to bound Redis memory usage.
   *
   * Configuration accepts three forms:
   *   - `true`: enable audit for all categories with defaults
   *   - `false` or omitted: disable all audit categories
   *   - `IMessageAuditConfig`: enable categories individually with
   *     per-category options
   *
   * @example
   * // Enable audit for all categories with unlimited storage
   * const config1: IRedisSMQConfig = { messageAudit: true };
   *
   * // Enable only dead-letter audit
   * const config2: IRedisSMQConfig = {
   *   messageAudit: { deadLetteredMessages: true },
   * };
   *
   * // Enable with per-category storage limits
   * const config3: IRedisSMQConfig = {
   *   messageAudit: {
   *     acknowledgedMessages: {
   *       enabled: true,
   *       queueSize: 5000,
   *       expire: 12 * 60 * 60, // 12 hours
   *     },
   *     deadLetteredMessages: {
   *       enabled: true,
   *       queueSize: 10000,
   *       expire: 7 * 24 * 60 * 60, // 7 days
   *     },
   *   },
   * };
   */
  messageAudit?: boolean | IMessageAuditConfig;
}

/**
 * A fully-resolved configuration.
 *
 * This is what `IConfigManager.getConfig()` returns and what every
 * internal component reads. Every field is populated, every union has
 * been narrowed, and every nested object has been normalized.
 *
 * Differences from `IRedisSMQConfig`:
 *
 *   - `namespace` is required and validated.
 *   - `logger` is a `ILoggerParsedConfig` with a resolved `enabled`
 *     boolean and a complete `options` object.
 *   - `messageAudit` is an `IMessageAuditParsedConfig` where every
 *     category is present with all its fields populated, regardless of
 *     whether the user supplied them individually or via the shorthand
 *     `true` / `false` forms.
 *
 * The top-level object is frozen by the library. Nested objects are
 * shared by reference; callers must not mutate any part of the returned
 * value.
 */
export interface IRedisSMQParsedConfig extends Required<
  Omit<IRedisSMQConfig, 'messageAudit' | 'logger'>
> {
  logger: ILoggerParsedConfig;
  messageAudit: IMessageAuditParsedConfig;
}
