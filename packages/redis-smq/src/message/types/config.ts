/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
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
 */
export interface IMessageAuditConfigOptions {
  /**
   * Maximum number of message IDs to store per queue.
   *
   * When this limit is reached, older message IDs are removed to make room for new ones.
   * Set to 0 for unlimited storage (default behavior).
   *
   * @default 0 (unlimited)
   */
  queueSize?: number;

  /**
   * Retention time for message IDs in seconds.
   *
   * Message IDs older than this duration are automatically removed from audit storage.
   * Set to 0 for unlimited retention time (default behavior).
   *
   * @default 0 (unlimited)
   */
  expire?: number;
}

/**
 * Parsed and normalized message audit configuration options.
 *
 * This interface represents the internal configuration after parsing user input
 * and applying default values.
 */
export interface IMessageAuditParsedConfigOptions {
  /**
   * Whether message audit is enabled for this message type.
   *
   * When true, dedicated storage is created to track message IDs.
   * When false, no audit storage is maintained.
   */
  enabled: boolean;

  /**
   * Maximum number of message IDs to store per queue.
   *
   * This value is always set after parsing, using either the user-provided
   * value or the default (0 = unlimited).
   */
  queueSize: number;

  /**
   * Retention time for message IDs in seconds.
   *
   * This value is always set after parsing, using either the user-provided
   * value or the default (0 = unlimited).
   */
  expire: number;
}

/**
 * Message audit configuration for different message types.
 *
 * Message audit allows tracking of processed messages by storing their IDs
 * in dedicated Redis storage structures. This enables efficient querying
 * of acknowledged and dead-lettered messages per queue.
 *
 * By default, both queueSize and expire are set to 0 (unlimited), which means
 * audit storage will grow indefinitely. Consider setting limits in production
 * environments to manage Redis memory usage.
 *
 * @example
 * ```typescript
 * // Enable audit for dead-lettered messages with unlimited storage
 * const config: IMessageAuditConfig = {
 *   deadLetteredMessages: true
 * };
 *
 * // Enable audit with custom limits to control storage growth
 * const config: IMessageAuditConfig = {
 *   acknowledgedMessages: {
 *     queueSize: 5000,        // limit to 5,000 message IDs per queue
 *     expire: 12 * 60 * 60    // retain for 12 hours
 *   },
 *   deadLetteredMessages: {
 *     queueSize: 10000,       // limit to 10,000 message IDs per queue
 *     expire: 7 * 24 * 60 * 60 // retain for 7 days
 *   }
 * };
 * ```
 */
export interface IMessageAuditConfig {
  /**
   * Audit configuration for acknowledged messages.
   *
   * When enabled, creates dedicated storage to track IDs of successfully
   * processed messages. This allows using QueueAcknowledgedMessages class
   * to browse and analyze acknowledged messages per queue.
   *
   * - `true`: Enable with default settings (unlimited storage and retention)
   * - `false` or `undefined`: Disable audit
   * - `IMessageAuditConfigOptions`: Enable with custom settings
   */
  acknowledgedMessages?: boolean | IMessageAuditConfigOptions;

  /**
   * Audit configuration for dead-lettered messages.
   *
   * When enabled, creates dedicated storage to track IDs of messages that
   * failed processing and exceeded retry limits. This allows using
   * QueueDeadLetteredMessages class to browse and analyze failed messages per queue.
   *
   * - `true`: Enable with default settings (unlimited storage and retention)
   * - `false` or `undefined`: Disable audit
   * - `IMessageAuditConfigOptions`: Enable with custom settings
   */
  deadLetteredMessages?: boolean | IMessageAuditConfigOptions;
}

/**
 * Parsed and normalized message audit configuration.
 *
 * This interface represents the internal configuration after parsing user input,
 * applying defaults, and normalizing all values. Both acknowledged and dead-lettered
 * message configurations are always present with explicit enabled/disabled state.
 */
export interface IMessageAuditParsedConfig {
  /**
   * Parsed configuration for acknowledged message audit.
   *
   * Contains the normalized settings including whether audit is enabled
   * and the effective queueSize and expire values (0 = unlimited).
   */
  acknowledgedMessages: IMessageAuditParsedConfigOptions;

  /**
   * Parsed configuration for dead-lettered message audit.
   *
   * Contains the normalized settings including whether audit is enabled
   * and the effective queueSize and expire values (0 = unlimited).
   */
  deadLetteredMessages: IMessageAuditParsedConfigOptions;
}
