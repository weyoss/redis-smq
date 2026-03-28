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
 * Message audit creates dedicated storage to track processed message IDs,
 * enabling efficient monitoring of acknowledged and dead-lettered messages per queue.
 *
 * This storage acts as a ring buffer with configurable size and expiration policies,
 * allowing you to control memory usage while maintaining visibility into message
 * processing history.
 */
export interface IMessageAuditMessagesConfig {
  /**
   * Enables or disables message audit tracking for this message type.
   *
   * When enabled, the system maintains a dedicated storage structure that tracks
   * message IDs as they are processed. This enables querying and monitoring
   * capabilities for messages in this category.
   *
   * When disabled, no audit data is stored, reducing memory overhead but losing
   * visibility into processed messages.
   *
   * @example
   * ```typescript
   * {
   *    // Enable audit tracking
   *    enabled: true
   *
   *    // Disable audit tracking (default)
   *    enabled: false
   * }
   * ```
   */
  enabled: boolean;

  /**
   * Maximum number of message IDs to store per queue.
   *
   * This setting controls the maximum capacity of the audit storage for each queue.
   * When the limit is reached, the oldest entries are automatically evicted to
   * accommodate new ones (FIFO behavior).
   *
   * Set to `0` to disable size-based eviction, allowing unlimited storage.
   * This is useful when you need to retain complete history without automatic cleanup.
   *
   * @default 0 (unlimited)
   *
   * @example
   * ```typescript
   * {
   *    // Store up to 1000 message IDs per queue
   *    queueSize: 1000
   *
   *    // Unlimited storage
   *    queueSize: 0
   * }
   * ```
   */
  queueSize: number;

  /**
   * Retention time for message IDs in seconds.
   *
   * Message IDs older than this duration are automatically purged from audit storage,
   * regardless of whether the queue size limit has been reached. This helps manage
   * long-term storage and ensures that only recent message history is retained.
   *
   * Set to `0` to disable time-based eviction, keeping messages indefinitely.
   *
   * @default 0 (unlimited)
   *
   * @example
   * ```typescript
   * {
   *    // Keep messages for 7 days (604,800 seconds)
   *    expire: 604800
   *
   *    // Keep messages indefinitely
   *    expire: 0
   * }
   * ```
   */
  expire: number;
}

/**
 * Configuration options for unacknowledgement message history.
 *
 * Unacknowledgement history tracks every time a message fails to be acknowledged,
 * storing detailed information about the failure cause and resolution action.
 * This provides a complete audit trail for message processing failures,
 * enabling debugging, monitoring, and analysis of processing issues.
 *
 * Each history entry includes:
 * - Timestamp of the failure
 * - Failure cause (error, timeout, etc.)
 - Resolution action taken (retry, dead-letter, etc.)
 */
export interface IMessageAuditHistoryConfig {
  /**
   * Enables or disables unacknowledgement history tracking.
   *
   * When enabled, each unacknowledgement event creates a comprehensive history record
   * containing failure details and the system's resolution action. This provides
   * valuable insights for debugging message processing issues and monitoring
   * application health.
   *
   * When disabled, no history records are stored, reducing storage overhead but
   * losing visibility into processing failures.
   *
   * @default false
   *
   * @example
   * ```typescript
   * {
   *    // Enable failure history tracking
   *    enabled: true
   * }
   * ```
   */
  enabled: boolean;

  /**
   * Maximum number of history entries to store per message.
   *
   * This setting controls how many failure events are retained for each message.
   * When the limit is reached, the oldest entries are evicted to make room for
   * new ones, maintaining a bounded history of the most recent failures.
   *
   * Set to `0` for unlimited storage, which can be useful for critical messages
   * where you need complete failure history.
   *
   * @default 100
   *
   * @example
   * ```typescript
   * {
   *    // Store last 50 failures per message
   *    maxSize: 50
   *
   *    // Store unlimited failures
   *    maxSize: 0
   * }
   * ```
   */
  maxSize: number;
}

/**
 * Root configuration interface for message audit system.
 *
 * This interface controls all audit-related features of the message queue system,
 * including tracking of acknowledged messages, dead-lettered messages, and
 * failure history. It provides flexible configuration options that can be
 * enabled/disabled and customized per audit category.
 *
 * Each audit category can be configured in three ways:
 * - `false` - Disable auditing for this category
 * - `true` - Enable auditing with default settings
 * - `Partial<IConfig>` - Enable auditing with custom settings
 *
 * @example
 * ```typescript
 * // Minimal configuration - enable all with defaults
 * const config: IMessageAuditConfig = {
 *   acknowledgedMessages: true,
 *   deadLetteredMessages: true,
 *   unacknowledgementHistory: true
 * };
 *
 * // Custom configuration with size limits and expiration
 * const config: IMessageAuditConfig = {
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
   * This is useful for:
   * - Monitoring successful message processing rates
   * - Auditing completed work
   * - Debugging message flow through the system
   *
   * @default false (audit disabled)
   *
   * @see QueueAcknowledgedMessages
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
   * Dead-lettered messages represent processing failures that require
   * manual intervention or separate handling. This audit trail helps:
   * - Identify problematic messages or handlers
   * - Monitor failure rates and patterns
   * - Implement dead-letter queue processing workflows
   *
   * @default false (audit disabled)
   *
   * @see QueueDeadLetteredMessages
   */
  deadLetteredMessages?: boolean | Partial<IMessageAuditMessagesConfig>;

  /**
   * Audit configuration for unacknowledgement message history.
   *
   * When enabled, tracks detailed history of message processing failures,
   * including each unacknowledgement event with failure causes and resolution
   * actions. This provides comprehensive debugging information and helps
   * identify systemic issues in message processing.
   *
   * Unlike acknowledged and dead-lettered audits which track only message IDs,
   * this feature stores rich metadata about each failure event.
   *
   * @default false (history tracking disabled)
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
 * This is an internal interface used by the system after configuration
 * validation and normalization.
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
