/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Configuration for message audit storage of a single category
 * (acknowledged or dead-lettered messages).
 *
 * Message audit creates a dedicated Redis list per queue that tracks
 * processed message IDs. The list behaves as a bounded ring buffer:
 * entries are appended at one end, and when either the size limit or
 * the time limit is reached, older entries are evicted.
 *
 * Two limits govern retention:
 *
 *   - `queueSize`: maximum number of message IDs to keep. When the list
 *     grows past this, the oldest entries are trimmed.
 *
 *   - `expire`: maximum age in seconds. Entries older than this are
 *     removed by Redis's passive expiration when the list is next
 *     touched.
 *
 * Both limits can be active simultaneously; the stricter one wins. A
 * value of `0` disables that limit. Setting both to `0` gives unlimited
 * retention — every processed message ID is kept for the lifetime of
 * the queue.
 *
 * @example
 * // Keep the last 1000 acknowledged message IDs, or entries from the
 * // last 7 days, whichever limit is reached first.
 * const cfg: IMessageAuditMessagesConfig = {
 *   enabled: true,
 *   queueSize: 1000,
 *   expire: 7 * 24 * 60 * 60,
 * };
 */
export interface IMessageAuditMessagesConfig {
  /**
   * Enables audit tracking for this message category.
   *
   * When enabled, the library maintains a Redis list per queue holding
   * the IDs of messages in this category (acknowledged, dead-lettered,
   * and so on). Browsing APIs such as `QueueAcknowledgedMessages` and
   * `QueueDeadLetteredMessages` read from these lists.
   *
   * When disabled, no IDs are recorded and the corresponding browsing
   * API raises a category-specific error
   * (`AcknowledgmentAuditDisabledError` or
   * `DeadLetterAuditDisabledError`).
   *
   * @default false
   */
  enabled: boolean;

  /**
   * Maximum number of message IDs to retain per queue.
   *
   * When the list exceeds this size, the oldest entries are trimmed to
   * keep the list at exactly `queueSize` entries. Trimming happens
   * inside the same Lua script that appends new IDs, so the list never
   * observably exceeds the limit.
   *
   * Setting to `0` disables the size limit. Combined with `expire: 0`,
   * this gives unlimited retention.
   *
   * @default 0
   */
  queueSize: number;

  /**
   * Maximum age of a message ID, in seconds.
   *
   * Older entries are removed by Redis's passive expiration the next
   * time the list is accessed. The library does not actively sweep the
   * list; removal is deferred to the next read or write.
   *
   * Setting to `0` disables time-based expiration. Combined with
   * `queueSize: 0`, this gives unlimited retention.
   *
   * The value is used as the argument to Redis's `PEXPIRE` after
   * converting from seconds to milliseconds internally. The unit in the
   * public config is seconds for readability; a value of `3600` means
   * one hour, not one millisecond.
   *
   * @default 0
   */
  expire: number;
}

/**
 * Configuration for unacknowledgement history tracking.
 *
 * Unacknowledgement history is a per-message log of the reasons a
 * message was not processed successfully. Each entry records the cause,
 * the resolution action taken, and the retry count at the time.
 *
 * Unlike the acknowledged and dead-lettered message audit categories,
 * unacknowledgement history is not a queue-level list of message IDs.
 * It is a per-message list attached to the message's own hash. The
 * purpose is diagnostic: when a message is repeatedly retried, the
 * history shows why each attempt failed.
 *
 * @example
 * const cfg: IMessageAuditHistoryConfig = {
 *   enabled: true,
 *   maxSize: 50,
 * };
 */
export interface IMessageAuditHistoryConfig {
  /**
   * Enables unacknowledgement history tracking.
   *
   * When enabled, each unacknowledgement of a message appends a record
   * to the message's history list. The record captures the cause, the
   * resolution (retry, delay, or dead-letter), and the timestamp.
   *
   * When disabled, no history is written and
   * `MessageManager.getMessageUnacknowledgementHistory()` raises
   * `UnacknowledgmentHistoryDisabledError`.
   *
   * @default false
   */
  enabled: boolean;

  /**
   * Maximum number of history entries to retain per message.
   *
   * When a message has been unacknowledged more times than `maxSize`,
   * the oldest entries are trimmed. Trimming happens inside the same
   * Lua script that appends the new entry.
   *
   * Setting to `0` disables the size limit; the history grows without
   * bound for the lifetime of the message. For a message that is
   * repeatedly retried and never dead-lettered, an unbounded history
   * can grow large enough to affect Redis memory usage.
   *
   * @default 100
   */
  maxSize: number;
}

/**
 * Root configuration for the message audit system.
 *
 * Each of the three audit categories can be configured independently in
 * one of three ways:
 *
 *   - `true`: enable with defaults
 *   - `false` or omitted: disable
 *   - `Partial<IConfig>`: enable with the specified values, defaults
 *     filled in for anything omitted
 *
 * The same object can mix forms — for example, `true` for one category
 * and an explicit object for another.
 *
 * @example
 * // Enable all three categories with defaults
 * const cfg1: IMessageAuditConfig = {
 *   acknowledgedMessages: true,
 *   deadLetteredMessages: true,
 *   unacknowledgementHistory: true,
 * };
 *
 * // Custom configuration with per-category storage limits
 * const cfg2: IMessageAuditConfig = {
 *   acknowledgedMessages: {
 *     enabled: true,
 *     queueSize: 10000,
 *     expire: 30 * 24 * 60 * 60,
 *   },
 *   deadLetteredMessages: {
 *     enabled: true,
 *     queueSize: 5000,
 *     expire: 7 * 24 * 60 * 60,
 *   },
 *   unacknowledgementHistory: {
 *     enabled: true,
 *     maxSize: 50,
 *   },
 * };
 */
export interface IMessageAuditConfig {
  /**
   * Audit configuration for acknowledged messages.
   *
   * When enabled, tracks the IDs of successfully processed messages.
   * Browsing APIs in `QueueAcknowledgedMessages` read from this store.
   *
   * @default false
   */
  acknowledgedMessages?: boolean | Partial<IMessageAuditMessagesConfig>;

  /**
   * Audit configuration for dead-lettered messages.
   *
   * When enabled, tracks the IDs of messages that failed processing and
   * exceeded their retry thresholds. Browsing APIs in
   * `QueueDeadLetteredMessages` read from this store.
   *
   * @default false
   */
  deadLetteredMessages?: boolean | Partial<IMessageAuditMessagesConfig>;

  /**
   * Audit configuration for unacknowledgement history.
   *
   * When enabled, each unacknowledgement appends a record to the
   * message's own history list. `MessageManager` reads from this store.
   *
   * @default false
   */
  unacknowledgementHistory?: boolean | Partial<IMessageAuditHistoryConfig>;
}

/**
 * Fully-resolved message audit configuration.
 *
 * This is what `IConfigManager.getConfig().messageAudit` returns and
 * what every internal component reads. Every category is present, every
 * union has been narrowed to its object form, and every numeric field
 * has a value.
 *
 * The three fields are always present. A category the user disabled (or
 * omitted) appears with `enabled: false` and its other fields at their
 * defaults. A category the user enabled with the shorthand `true`
 * appears with `enabled: true` and every other field at its default.
 *
 * The shape is stable across both raw forms — `true` and an object — so
 * internal code that reads `cfg.messageAudit.acknowledgedMessages.enabled`
 * does not need to branch on which form the user supplied.
 */
export interface IMessageAuditParsedConfig {
  /** Resolved configuration for the acknowledged-messages category. */
  acknowledgedMessages: IMessageAuditMessagesConfig;

  /** Resolved configuration for the dead-lettered-messages category. */
  deadLetteredMessages: IMessageAuditMessagesConfig;

  /** Resolved configuration for the unacknowledgement-history category. */
  unacknowledgementHistory: IMessageAuditHistoryConfig;
}
