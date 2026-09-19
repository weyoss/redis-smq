/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Configuration for a batch operation (acknowledgement or
 * unacknowledgement).
 *
 * When a batch is enabled, messages are accumulated and written to Redis
 * in groups rather than one at a time. This trades latency for
 * throughput: a message is not marked as processed until its batch
 * flushes, but the flush handles many messages per Redis round trip.
 *
 * All fields are optional. The consumer merges the provided values with
 * its current defaults.
 */
export interface IConsumerBatchConfig {
  /**
   * Whether this batch is active.
   *
   * When false, the corresponding operation is performed on each message
   * immediately, ignoring `batchSize` and `batchTimeoutMs`.
   */
  enabled?: boolean;

  /**
   * Maximum number of messages to accumulate before flushing.
   *
   * Reaching the batch size triggers an immediate flush, independent of
   * `batchTimeoutMs`.
   */
  batchSize?: number;

  /**
   * Maximum time in milliseconds to hold a batch before flushing.
   *
   * Prevents messages from waiting indefinitely when the arrival rate is
   * low. Whichever comes first — the batch filling or this timeout —
   * triggers the flush.
   */
  batchTimeoutMs?: number;
}

/**
 * Constructor options for a `Consumer`.
 *
 * All fields are optional. The consumer merges the provided values with
 * its current defaults, which can be inspected via
 * `Consumer.getDefaultOptions()` and replaced via
 * `Consumer.setDefaultOptions()`.
 */
export interface IConsumerOptions {
  /**
   * Time-to-live in milliseconds for this consumer's heartbeat key in
   * Redis.
   *
   * A consumer is considered offline if its heartbeat key has expired.
   * Other consumers in the same queue use this to detect offline peers
   * and recover any messages left in their processing queues. Longer
   * TTLs tolerate transient disconnects; shorter TTLs recover faster.
   *
   * Choose a value comfortably larger than the longest tolerable pause
   * between heartbeats. The default (60000) tolerates the process being
   * suspended for a few seconds without triggering peer recovery.
   */
  heartbeatTTL?: number;

  /**
   * Enables multiplexed consumption across all queues.
   *
   * When true, a single consumer instance schedules all of its message
   * handlers through a shared round-robin tick loop instead of running a
   * dedicated dequeue loop per handler. This reduces the number of Redis
   * connections the consumer holds and is useful when a single process
   * handles many queues.
   *
   * When false (the default), each handler runs its own dequeue loop on
   * its own connection. This gives lower latency per message.
   */
  enableMultiplexing?: boolean;

  /**
   * Configuration for the acknowledgement batch.
   *
   * Accepts:
   *   - `true`: enable batching with the current defaults
   *   - `false`: disable batching; acknowledge each message immediately
   *   - `IConsumerBatchConfig`: enable with the specified values, filling
   *     unset fields from the current defaults
   */
  batchAcks?: boolean | IConsumerBatchConfig;

  /**
   * Configuration for the unacknowledgement batch.
   *
   * Same shape and semantics as `batchAcks`. Applies to unacknowledgement
   * requests (retries, dead-letters, and delays).
   */
  batchUnacks?: boolean | IConsumerBatchConfig;
}

/**
 * The fully-resolved option set a consumer runs with.
 *
 * Every field is required, and the two batch unions are narrowed to their
 * object form with every field populated. This is what
 * `Consumer.getDefaultOptions()` returns and what the consumer stores
 * internally after merging user options with defaults.
 *
 * A caller programming against `IConsumerOptions` can accept the parsed
 * form anywhere it accepts the raw form; the parsed form is a strict
 * subtype of the union-free version.
 */
export interface IConsumerParsedOptions extends Required<
  Omit<IConsumerOptions, 'batchAcks' | 'batchUnacks'>
> {
  batchAcks: Required<IConsumerBatchConfig>;
  batchUnacks: Required<IConsumerBatchConfig>;
}
