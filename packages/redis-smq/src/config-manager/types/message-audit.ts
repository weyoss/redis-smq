/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Configuration options for message audit storage.
 *
 * Message audit creates dedicated Redis storage structures to track processed message IDs,
 * enabling efficient monitoring of acknowledged and dead-lettered messages per queue.
 *
 * The storage acts as a ring buffer with configurable size and expiration policies:
 * - When `queueSize` limit is reached, oldest entries are automatically evicted (FIFO)
 * - When `expire` time is reached, entries are removed regardless of size
 * - Both limits can be used together for fine-grained retention control
 *
 * @example
 * ```typescript
 * // Store last 1000 messages or messages from last 7 days (whichever is smaller)
 * const config: IMessageAuditMessagesConfig = {
 *   enabled: true,
 *   queueSize: 1000,
 *   expire: 604800 // 7 days in seconds
 * };
 * ```
 */
export interface IMessageAuditMessagesConfig {
  /**
   * Enables or disables message audit tracking for this message type.
   *
   * When enabled, the system maintains a Redis sorted set for each queue,
   * storing message IDs with their processing timestamps as scores.
   * This enables querying and monitoring capabilities for messages in this category.
   *
   * When disabled, no audit data is stored, reducing Redis memory overhead
   * but losing visibility into processed message history.
   *
   * @default false
   */
  enabled: boolean;

  /**
   * Maximum number of message IDs to store per queue.
   *
   * Controls the maximum capacity of the audit storage for each queue.
   * When the limit is reached, the oldest entries (by timestamp) are
   * automatically evicted to accommodate new ones.
   *
   * Set to `0` to disable size-based eviction, allowing unlimited storage.
   *
   * @default 0
   */
  queueSize: number;

  /**
   * Retention time for message IDs in seconds.
   *
   * Message IDs older than this duration are automatically purged from audit storage,
   * regardless of whether the queue size limit has been reached.
   *
   * Set to `0` to disable time-based eviction, keeping messages indefinitely.
   *
   * @default 0
   */
  expire: number;
}

/**
 * Configuration options for unacknowledgement message history.
 *
 * Tracks detailed history of message processing failures, storing rich metadata
 * about each unacknowledgement event including failure causes and resolution actions.
 * This provides comprehensive debugging information and helps identify systemic
 * issues in message processing.
 *
 * Each history entry includes:
 * - Timestamp of the failure
 * - Failure cause (error, timeout, etc.)
 * - Resolution action taken (retry, dead-letter, acknowledge)
 * - Retry attempt number
 *
 * @example
 * ```typescript
 * const config: IMessageAuditHistoryConfig = {
 *   enabled: true,
 *   maxSize: 50 // Keep last 50 failures per message
 * };
 * ```
 */
export interface IMessageAuditHistoryConfig {
  /**
   * Enables or disables unacknowledgement history tracking.
   *
   * When enabled, each unacknowledgement event creates a comprehensive history record
   * containing failure details and the system's resolution action.
   *
   * When disabled, no history records are stored, reducing storage overhead but
   * losing visibility into processing failures.
   *
   * @default false
   */
  enabled: boolean;

  /**
   * Maximum number of history entries to store per message.
   *
   * Controls how many failure events are retained for each message.
   * When the limit is reached, the oldest entries are evicted to make room for
   * new ones, maintaining a bounded history of the most recent failures.
   *
   * Set to `0` for unlimited storage.
   *
   * @default 100
   */
  maxSize: number;
}

/**
 * Root configuration interface for message audit system.
 *
 * Each audit category can be configured in three ways:
 * - `false` - Disable auditing for this category
 * - `true` - Enable auditing with default settings (queueSize=0, expire=0, maxSize=100)
 * - `Partial<IConfig>` - Enable auditing with custom settings
 *
 * @example
 * ```typescript
 * // Minimal configuration - enable all with defaults
 * let config: IMessageAuditConfig = {
 *   acknowledgedMessages: true,
 *   deadLetteredMessages: true,
 *   unacknowledgementHistory: true
 * };
 *
 * // Custom configuration with size limits and expiration
 * config = {
 *   acknowledgedMessages: {
 *     enabled: true,
 *     queueSize: 10000,
 *     expire: 2592000 // 30 days
 *   },
 *   deadLetteredMessages: {
 *     enabled: true,
 *     queueSize: 5000,
 *     expire: 604800 // 7 days
 *   },
 *   unacknowledgementHistory: {
 *     enabled: true,
 *     maxSize: 50
 *   }
 * };
 * ```
 */
export interface IMessageAuditConfig {
  /**
   * Audit configuration for acknowledged messages.
   *
   * When enabled, creates dedicated storage to track IDs of successfully
   * processed messages. This allows using the `QueueAcknowledgedMessages` class
   * to browse, query, and analyze acknowledged messages per queue.
   *
   * @default false
   */
  acknowledgedMessages?: boolean | Partial<IMessageAuditMessagesConfig>;

  /**
   * Audit configuration for dead-lettered messages.
   *
   * When enabled, creates dedicated storage to track IDs of messages that
   * failed processing and exceeded their retry limits. This allows using
   * the `QueueDeadLetteredMessages` class to browse, query, and analyze
   * failed messages per queue.
   *
   * @default false
   */
  deadLetteredMessages?: boolean | Partial<IMessageAuditMessagesConfig>;

  /**
   * Audit configuration for unacknowledgement message history.
   *
   * When enabled, tracks detailed history of message processing failures,
   * including each unacknowledgement event with failure causes and resolution
   * actions. This provides comprehensive debugging information.
   *
   * @default false
   */
  unacknowledgementHistory?: boolean | Partial<IMessageAuditHistoryConfig>;
}

/**
 * Parsed and normalized configuration interface.
 *
 * This interface represents the final configuration after processing and
 * merging defaults. It contains fully resolved configuration objects for
 * each audit category, with all optional fields populated with their
 * default values.
 *
 * @internal
 */
export interface IMessageAuditParsedConfig {
  /** Normalized configuration for acknowledged messages audit */
  acknowledgedMessages: IMessageAuditMessagesConfig;

  /** Normalized configuration for dead-lettered messages audit */
  deadLetteredMessages: IMessageAuditMessagesConfig;

  /** Normalized configuration for unacknowledgement history */
  unacknowledgementHistory: IMessageAuditHistoryConfig;
}
