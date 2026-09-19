/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IRedisSMQConfig, IRedisSMQParsedConfig } from './config.js';

/**
 * Manages the runtime configuration of a RedisSMQ instance.
 *
 * Configuration is stored in Redis under a single key and is shared
 * across every process connected to the same Redis instance. A change
 * made through `updateConfig()` propagates to other processes via the
 * configuration sync mechanism — each process updates its in-memory
 * copy when it observes a version bump.
 *
 * The version number is monotonically increasing. Every successful
 * `updateConfig()` increments it. Two processes racing to update the
 * same configuration are serialized by a version-check script: the
 * second writer either observes the first writer's version and reloads
 * before applying its own change, or fails with
 * `ConfigurationUpdateError`.
 *
 * Both the promise and callback forms are declared for every
 * asynchronous method, matching the concrete class.
 *
 * @example
 * const configManager = new ConfigManager();
 *
 * // Read the current configuration
 * const config = configManager.getConfig();
 * console.log(config.namespace);
 *
 * // Update a single section
 * await configManager.updateConfig({
 *   messageAudit: {
 *     acknowledgedMessages: { enabled: true, queueSize: 5000 },
 *   },
 * });
 */
export interface IConfigManager {
  /**
   * Reloads the in-memory configuration from Redis.
   *
   * Discards the current in-memory copy and re-reads the persisted
   * configuration. Useful when a caller suspects the local copy is
   * stale — for example, after a network partition that may have
   * prevented configuration-change events from arriving.
   *
   * In normal operation, `ConfigSync` handles propagation automatically;
   * a caller rarely needs to call `reload()` directly. It exists as an
   * escape hatch for scenarios where automatic propagation may have
   * failed.
   *
   * Fails with `ConfigurationNotFoundError` if no configuration exists
   * in Redis — a state that only occurs if the RedisSMQ instance was
   * shut down and the configuration key was removed externally.
   */
  reload(): Promise<IRedisSMQParsedConfig>;
  reload(cb: ICallback<IRedisSMQParsedConfig>): void;

  /**
   * Applies a partial configuration update.
   *
   * The update is merged with the current configuration and persisted.
   * Merge semantics are deep: nested sections (messageAudit, logger) are
   * merged field by field, so updating one sub-key does not clear the
   * others. The precise behavior:
   *
   *   - Scalar fields (namespace) are replaced.
   *   - Object sections are deep-merged.
   *   - Union-typed sections (a `boolean | object` field) respect the
   *     caller's intent: passing a boolean replaces the object, passing
   *     an object merges into it.
   *
   * After the merge, the resulting configuration is validated and parsed
   * against the same rules that apply at initialization. An invalid
   * combination (for example, a rate limit with a non-positive limit)
   * fails with the corresponding validation error, and the persisted
   * configuration is left unchanged.
   *
   * If the update produces no change from the current configuration, the
   * call resolves without writing and without incrementing the version.
   *
   * @example
   * // Enable message audit for all categories with defaults
   * await configManager.updateConfig({ messageAudit: true });
   *
   * // Enable only acknowledged-message audit with a queue cap
   * await configManager.updateConfig({
   *   messageAudit: {
   *     acknowledgedMessages: { enabled: true, queueSize: 5000 },
   *   },
   * });
   *
   * // Change the log level without disturbing other logger options
   * await configManager.updateConfig({
   *   logger: { options: { logLevel: EConsoleLoggerLevel.DEBUG } },
   * });
   */
  updateConfig(updates: IRedisSMQConfig): Promise<void>;
  updateConfig(updates: IRedisSMQConfig, cb: ICallback): void;

  /**
   * Returns the current configuration version.
   *
   * The version starts at 1 for a newly initialized RedisSMQ instance
   * and increments by one on every successful `updateConfig()`. Two
   * configurations with the same version are guaranteed to describe the
   * same effective settings — the version is the monotonic identifier
   * of the configuration's state.
   *
   * Useful for building caches keyed on version, or for diagnostics.
   */
  getConfigVersion(): number;

  /**
   * Returns the current parsed configuration.
   *
   * The returned object is a read-only snapshot. Every field has been
   * validated and normalized during parsing — for example, `messageAudit`
   * is a fully-resolved object regardless of how the user supplied it,
   * and `logger.options.logLevel` is an `EConsoleLoggerLevel` value
   * rather than a string.
   *
   * The object is frozen at the top level; nested objects are shared by
   * reference with the internal configuration. Callers must not mutate
   * any part of the returned value. The library does not defensively
   * clone on every call; mutations made by a caller will be observed by
   * subsequent internal reads, leading to undefined behavior.
   *
   * @example
   * const config = configManager.getConfig();
   * if (config.messageAudit.acknowledgedMessages.enabled) {
   *   // acknowledged-message audit is active
   * }
   */
  getConfig(): IRedisSMQParsedConfig;
}
