/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IExchangeParams, IExchangeParsedParams } from '../exchange/index.js';
import { IQueueParams } from '../queue-manager/queue.js';
import { EMessagePriority } from './message.js';

/**
 * A fluent builder that describes a message to be published.
 *
 * Every configuration method returns the same instance, so calls can be
 * chained. The builder is not itself a message — it becomes one when
 * handed to `IProducer.produce()`, at which point the producer wraps it
 * in a `MessageEnvelope` and assigns a destination.
 *
 * A `ProducibleMessage` starts with defaults for TTL, retry policy, and
 * consume timeout. Those defaults are process-wide, configurable via the
 * static `setDefaultConsumeOptions` on the concrete class. Per-instance
 * overrides are made through the corresponding `set*` methods.
 *
 * Destination is set exactly one way:
 *   - `setQueue(queue)` for direct-to-queue publishing, or
 *   - one of `setDirectExchange`, `setTopicExchange`, `setFanoutExchange`
 *     for exchange publishing (optionally followed by
 *     `setExchangeRoutingKey` for direct and topic exchanges).
 *
 * Setting a queue clears any previously set exchange, and vice versa. A
 * message with neither a queue nor an exchange is rejected by
 * `IProducer.produce()`.
 *
 * @example
 * // Direct to a queue
 * const msg = new ProducibleMessage()
 *   .setQueue('orders')
 *   .setBody({ orderId: 123 })
 *   .setTTL(60_000);
 *
 * // Through a topic exchange
 * const msg2 = new ProducibleMessage()
 *   .setTopicExchange('events')
 *   .setExchangeRoutingKey('order.created')
 *   .setBody({ orderId: 456 });
 */
export interface IProducibleMessage {
  /**
   * Sets the target queue.
   *
   * Clears any previously configured exchange and routing key. The queue
   * may be a bare name (resolved against the configured default
   * namespace) or `{ name, ns }`.
   *
   * @throws InvalidQueueParametersError if the name or namespace is
   *   empty or contains characters not allowed in a Redis key.
   */
  setQueue(queue: string | IQueueParams): IProducibleMessage;

  /**
   * Returns the configured target queue, or `null` if the message is
   * destined for an exchange (or has no destination yet).
   */
  getQueue(): IQueueParams | null;

  /**
   * Sets a fanout exchange as the destination.
   *
   * Clears any previously configured queue, exchange, and routing key.
   * Fanout exchanges ignore routing keys — every bound queue receives a
   * copy of the message.
   */
  setFanoutExchange(exchange: string | IExchangeParams): IProducibleMessage;

  /**
   * Sets a topic exchange as the destination.
   *
   * Clears any previously configured queue, exchange, and routing key.
   * A routing key must be supplied via `setExchangeRoutingKey()` before
   * the message is produced; producing without one fails with
   * `RoutingKeyRequiredError`.
   */
  setTopicExchange(exchange: string | IExchangeParams): IProducibleMessage;

  /**
   * Sets a direct exchange as the destination.
   *
   * Clears any previously configured queue, exchange, and routing key.
   * A routing key must be supplied via `setExchangeRoutingKey()` before
   * the message is produced; producing without one fails with
   * `RoutingKeyRequiredError`.
   */
  setDirectExchange(exchange: string | IExchangeParams): IProducibleMessage;

  /**
   * Sets the routing key for exchange-based delivery.
   *
   * @throws ExchangeRequiredError if no exchange has been set yet.
   */
  setExchangeRoutingKey(routingKey: string): IProducibleMessage;

  /**
   * Returns the configured routing key, or `null` if none was set.
   */
  getExchangeRoutingKey(): string | null;

  /**
   * Returns the configured exchange, or `null` if the message is
   * destined for a queue (or has no destination yet).
   */
  getExchange(): IExchangeParsedParams | null;

  // ─── Consume options ──────────────────────────────────────────────────

  /**
   * Sets the Time-To-Live for this message, in milliseconds.
   *
   * A value of `0` means the message never expires. TTL is evaluated by
   * the consumer at checkout: if `createdAt + ttl` is in the past, the
   * message is unacknowledged with cause `TTL_EXPIRED` and moved to the
   * dead-letter list.
   *
   * @throws MessagePropertyInvalidValueError if the value is not a
   *   non-negative number.
   */
  setTTL(ttl: number): IProducibleMessage;

  /**
   * Returns the configured TTL in milliseconds. `0` means no expiry.
   */
  getTTL(): number;

  /**
   * Sets the maximum time a consumer is given to process this message,
   * in milliseconds.
   *
   * A value of `0` means no timeout. When a consumer exceeds the
   * timeout, the message is unacknowledged with cause `TIMEOUT` and
   * requeued or delayed according to its retry policy.
   *
   * @throws MessagePropertyInvalidValueError if the value is not a
   *   non-negative number.
   */
  setConsumeTimeout(timeout: number): IProducibleMessage;

  /**
   * Returns the configured consume timeout in milliseconds.
   */
  getConsumeTimeout(): number;

  /**
   * Sets the maximum number of processing attempts before this message
   * is dead-lettered.
   *
   * @throws MessagePropertyInvalidValueError if the value is not a
   *   non-negative number.
   */
  setRetryThreshold(threshold: number): IProducibleMessage;

  /**
   * Returns the configured retry threshold.
   */
  getRetryThreshold(): number;

  /**
   * Sets the delay between processing attempts when a message fails, in
   * milliseconds.
   *
   * A value of `0` causes failed messages to be requeued immediately; a
   * positive value places them in the delayed set for the configured
   * interval before retrying.
   *
   * @throws MessagePropertyInvalidValueError if the value is not a
   *   non-negative number.
   */
  setRetryDelay(delay: number): IProducibleMessage;

  /**
   * Returns the configured retry delay in milliseconds.
   */
  getRetryDelay(): number;

  // ─── Payload ──────────────────────────────────────────────────────────

  /**
   * Sets the message payload. Any JSON-serializable value is accepted.
   *
   * The library does not validate or transform the payload; it is
   * serialized to JSON, stored on the message hash, and returned
   * unchanged to consumers.
   */
  setBody(body: unknown): IProducibleMessage;

  /**
   * Returns the message payload.
   */
  getBody(): unknown;

  // ─── Priority ─────────────────────────────────────────────────────────

  /**
   * Sets the priority level.
   *
   * Only meaningful for PRIORITY_QUEUE queues. Setting a priority on a
   * message destined for a FIFO or LIFO queue causes production to fail
   * with `PriorityQueuingNotEnabledError`; producing without a priority
   * to a priority queue fails with `MessagePriorityRequiredError`.
   */
  setPriority(priority: EMessagePriority): IProducibleMessage;

  /**
   * Returns `true` if a priority has been set.
   */
  hasPriority(): boolean;

  /**
   * Clears the priority.
   */
  disablePriority(): IProducibleMessage;

  /**
   * Returns the configured priority, or `null` if none was set.
   */
  getPriority(): EMessagePriority | null;

  // ─── Scheduling ───────────────────────────────────────────────────────

  /**
   * Sets a CRON expression for scheduled delivery.
   *
   * Accepts both 5-field (standard Unix) and 6-field (with seconds)
   * expressions. A 5-field expression is treated as if it had a leading
   * `0` seconds field.
   *
   * @throws InvalidCronExpressionError if the expression is empty, has
   *   an unsupported field count, or does not parse.
   */
  setScheduledCRON(cron: string): IProducibleMessage;

  /**
   * Returns the configured CRON expression, or `null`.
   */
  getScheduledCRON(): string | null;

  /**
   * Sets a delay before the message's first delivery, in milliseconds.
   *
   * Mutually exclusive in effect with CRON scheduling: a message with a
   * delay is delivered once, at `now + delay`.
   *
   * @throws MessagePropertyInvalidValueError if the value is not a
   *   non-negative number.
   */
  setScheduledDelay(delay: number): IProducibleMessage;

  /**
   * Returns the configured initial delay, or `null`.
   */
  getScheduledDelay(): number | null;

  /**
   * Sets the repeat period for scheduled delivery, in milliseconds.
   *
   * Applies only when `setScheduledRepeat(n)` has been called with
   * `n > 0`. For a message with both CRON and repeat configured, the
   * CRON expression acts as a trigger — each CRON tick begins a new
   * repeat cycle.
   *
   * @throws MessagePropertyInvalidValueError if the value is not a
   *   non-negative number.
   */
  setScheduledRepeatPeriod(period: number): IProducibleMessage;

  /**
   * Returns the configured repeat period, or `null`.
   */
  getScheduledRepeatPeriod(): number | null;

  /**
   * Sets the number of times a scheduled message repeats after its
   * initial delivery.
   *
   * @throws MessagePropertyInvalidValueError if the value is not a
   *   non-negative number.
   */
  setScheduledRepeat(repeat: number): IProducibleMessage;

  /**
   * Returns the configured repeat count.
   */
  getScheduledRepeat(): number;

  /**
   * Resets every scheduling parameter — CRON, delay, repeat period, and
   * repeat count — to its default (unset).
   */
  resetScheduledParams(): IProducibleMessage;

  // ─── Metadata ─────────────────────────────────────────────────────────

  /**
   * Returns the timestamp at which this builder was constructed.
   *
   * The value is set in the constructor and never changes. It is used
   * together with the TTL to determine whether the message has expired.
   */
  getCreatedAt(): number;
}
