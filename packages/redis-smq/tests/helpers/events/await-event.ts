/**
 * Awaiter helpers for RedisSMQ events.
 *
 * Two families:
 *
 *   - Bus events — delivered on the shared bus from `event-bus.ts`. This is
 *     the entire public surface defined by `TRedisSMQEvent`: configuration,
 *     consumer lifecycle, consumer message outcomes, producer lifecycle,
 *     producer message publication, and queue lifecycle.
 *
 *   - Consumer-instance events — `consumer.down` is emitted on the consumer
 *     instance as well as on the bus. `untilConsumerDown` uses the instance
 *     variant so a `consumer.down` from a *different* consumer cannot
 *     satisfy the await. This matters in multi-consumer tests.
 *
 * CONTRACT — subscribe before triggering:
 *   Every awaiter subscribes immediately when called. It cannot observe
 *   events that fired before it was created. Callers must invoke the
 *   awaiter *before* the action that produces the event:
 *
 *     const acked = untilMessageAcknowledged(consumer, id);   // subscribe
 *     await producer.produce(msg);                            // trigger
 *     await acked;                                            // wait
 *
 * TIMEOUTS:
 *   Each awaiter rejects after `DEFAULT_AWAIT_TIMEOUT_MS` (15s) if the
 *   predicate never matches. The rejection names the exact event, consumer,
 *   and message ID being awaited — more useful than Vitest's bare "test
 *   timed out". Pass `{ timeoutMs: 0 }` to disable the timeout per call.
 *
 * TYPE NOTE:
 *   `TRedisSMQEvent` is an intersection of event maps. When `K` is a generic
 *   parameter, `TRedisSMQEvent[K]` collapses to an intersection of every
 *   handler shape, and TypeScript cannot reconcile a rest-args function with
 *   that intersection. `awaitEvent` therefore declares the listener as a
 *   rest-args function and asserts it to `TRedisSMQEvent[K]` — this is
 *   sound at runtime because the bus invokes the listener with exactly the
 *   parameters of `event`. The assertion is confined to one line inside
 *   `awaitEvent`; the public API and every call site remain fully typed.
 */

import type {
  EMessageDeadLetterCause,
  EMessageUnacknowledgementCause,
  IConsumer,
  TRedisSMQEvent,
} from '../../../src/index.js';
import { getEventBus } from './event-bus.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Default per-await timeout. Must be strictly less than the Vitest
 * `testTimeout` in `vitest.config.ts` so this fires first with a useful
 * message.
 */
export const DEFAULT_AWAIT_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface IAwaitEventOptions {
  /**
   * Milliseconds to wait before rejecting. `0` disables the timeout.
   * Defaults to `DEFAULT_AWAIT_TIMEOUT_MS`.
   */
  timeoutMs?: number;
  /**
   * Description included in timeout error messages. Most helpers supply a
   * sensible default; override for extra context.
   */
  description?: string;
}

/**
 * A predicate over a bus event's arguments. Derived from the event map so
 * the parameter types are exactly the event's payload.
 */
export type TBusPredicate<K extends keyof TRedisSMQEvent> = (
  ...args: Parameters<TRedisSMQEvent[K]>
) => boolean;

// ---------------------------------------------------------------------------
// Generic bus awaiter
// ---------------------------------------------------------------------------

/**
 * Wait for a bus event to fire and satisfy `predicate`.
 *
 * Events whose predicate returns `false` are ignored and the awaiter keeps
 * listening — this is why we cannot use `once`. The listener is removed on
 * every terminal path: resolve, predicate throw, and timeout.
 *
 * Prefer the specific helpers below when they cover your case; they encode
 * the filtering rules and produce better timeout messages. Use this
 * directly for events without a dedicated helper (e.g.
 * `consumer.messageReceived`, `producer.messagePublished`,
 * `queue.stateChanged`).
 */
export async function awaitEvent<K extends keyof TRedisSMQEvent>(
  event: K,
  predicate: TBusPredicate<K>,
  options: IAwaitEventOptions = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_AWAIT_TIMEOUT_MS;
  const description = options.description ?? String(event);

  const bus = await getEventBus();

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // `handler` is declared with an explicit type assertion to
    // `TRedisSMQEvent[K]`. The implementation uses rest args because K is
    // generic — we cannot name the individual parameters. TypeScript cannot
    // prove a rest-args function is assignable to the intersection of named
    // parameter functions that `TRedisSMQEvent[K]` collapses to when K is a
    // type parameter, so the assertion is required.
    //
    // It is sound: at runtime the bus invokes the listener with exactly the
    // parameters of `event`, which are exactly what `predicate` accepts.
    const handler = ((...args: Parameters<TRedisSMQEvent[K]>) => {
      let matched: boolean;
      try {
        matched = predicate(...args);
      } catch (err) {
        cleanup();
        reject(err);
        return;
      }
      if (matched) {
        cleanup();
        resolve();
      }
    }) as TRedisSMQEvent[K];

    const cleanup = (): void => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) clearTimeout(timer);
      bus.removeListener(event, handler);
    };

    bus.on(event, handler);

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            `await-event: ${description} did not fire within ${timeoutMs}ms`,
          ),
        );
      }, timeoutMs);
    }
  });
}

// ---------------------------------------------------------------------------
// Consumer message awaiters
// ---------------------------------------------------------------------------

/**
 * Resolve when `consumer` acknowledges a message.
 *
 * Pass `messageId` to match a specific message; omit it to match the first
 * message this consumer acks.
 */
export function untilMessageAcknowledged(
  consumer: IConsumer,
  messageId?: string,
  options: IAwaitEventOptions = {},
): Promise<void> {
  return awaitEvent(
    'consumer.messageAcknowledged',
    (id, _queue, consumerId) =>
      consumerId === consumer.getId() &&
      (messageId === undefined || id === messageId),
    describe(options, 'consumer.messageAcknowledged', consumer, messageId),
  );
}

/**
 * Resolve when `consumer` dead-letters a message. Optionally filter by the
 * reason the message was dead-lettered (TTL, retry threshold, periodic
 * termination).
 */
export function untilMessageDeadLettered(
  consumer: IConsumer,
  messageId?: string,
  deadLetterCause?: EMessageDeadLetterCause,
  options: IAwaitEventOptions = {},
): Promise<void> {
  return awaitEvent(
    'consumer.messageDeadLettered',
    (id, _queue, consumerId, cause) =>
      consumerId === consumer.getId() &&
      (messageId === undefined || id === messageId) &&
      (deadLetterCause === undefined || cause === deadLetterCause),
    describe(
      options,
      'consumer.messageDeadLettered',
      consumer,
      messageId,
      deadLetterCause !== undefined ? `cause=${deadLetterCause}` : undefined,
    ),
  );
}

/**
 * Resolve when `consumer` unacknowledges a message.
 *
 * `messageId` and `cause` are both optional filters. Pass `null` for
 * `messageId` to explicitly opt out of ID matching (matches the original
 * `string | null` signature); `undefined` behaves identically.
 */
export function untilMessageUnacknowledged(
  consumer: IConsumer,
  messageId?: string | null,
  cause?: EMessageUnacknowledgementCause,
  options: IAwaitEventOptions = {},
): Promise<void> {
  const idFilter = messageId ?? undefined;
  return awaitEvent(
    'consumer.messageUnacknowledged',
    (id, _queue, consumerId, eventCause) =>
      consumerId === consumer.getId() &&
      (idFilter === undefined || id === idFilter) &&
      (cause === undefined || eventCause === cause),
    describe(
      options,
      'consumer.messageUnacknowledged',
      consumer,
      idFilter,
      cause !== undefined ? `cause=${cause}` : undefined,
    ),
  );
}

/**
 * Resolve when `consumer` requeues a message for immediate reprocessing.
 *
 * Fires alongside `consumer.messageUnacknowledged`; this helper filters to
 * the requeue resolution specifically.
 */
export function untilMessageRequeued(
  consumer: IConsumer,
  messageId?: string,
  options: IAwaitEventOptions = {},
): Promise<void> {
  return awaitEvent(
    'consumer.messageRequeued',
    (id, _queue, consumerId) =>
      consumerId === consumer.getId() &&
      (messageId === undefined || id === messageId),
    describe(options, 'consumer.messageRequeued', consumer, messageId),
  );
}

/**
 * Resolve when `consumer` delays a message for a scheduled retry.
 *
 * Fires alongside `consumer.messageUnacknowledged`; this helper filters to
 * the delay resolution specifically.
 */
export function untilMessageDelayed(
  consumer: IConsumer,
  messageId?: string,
  options: IAwaitEventOptions = {},
): Promise<void> {
  return awaitEvent(
    'consumer.messageDelayed',
    (id, _queue, consumerId) =>
      consumerId === consumer.getId() &&
      (messageId === undefined || id === messageId),
    describe(options, 'consumer.messageDelayed', consumer, messageId),
  );
}

// ---------------------------------------------------------------------------
// Consumer-instance awaiter
// ---------------------------------------------------------------------------

/**
 * Resolve when `consumer` emits `consumer.down`.
 *
 * Uses the consumer *instance*, not the bus, so a `consumer.down` event for
 * a different consumer cannot accidentally satisfy the await.
 */
export function untilConsumerDown(
  consumer: IConsumer,
  options: IAwaitEventOptions = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_AWAIT_TIMEOUT_MS;
  const description =
    options.description ?? `consumer.down(consumer=${consumer.getId()})`;

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const handler = (): void => {
      cleanup();
      resolve();
    };

    const cleanup = (): void => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) clearTimeout(timer);
      consumer.removeListener('consumer.down', handler);
    };

    consumer.on('consumer.down', handler);

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            `await-event: ${description} did not fire within ${timeoutMs}ms`,
          ),
        );
      }, timeoutMs);
    }
  });
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Merge a generated description into caller-provided options. An explicit
 * `description` on `options` wins.
 */
function describe(
  options: IAwaitEventOptions,
  event: string,
  consumer: IConsumer,
  messageId?: string,
  extra?: string,
): IAwaitEventOptions {
  const parts = [`consumer=${consumer.getId()}`];
  if (messageId !== undefined) parts.push(`messageId=${messageId}`);
  if (extra !== undefined) parts.push(extra);
  return {
    ...options,
    description: options.description ?? `${event}(${parts.join(', ')})`,
  };
}
