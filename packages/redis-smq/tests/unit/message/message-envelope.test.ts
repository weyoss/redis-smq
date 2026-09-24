/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { MessageEnvelope } from '../../../src/core/message/message-envelope.js';
import { MessageState } from '../../../src/core/message/message-state.js';
import {
  EMessagePropertyStatus,
  errors,
  RedisSMQ,
} from '../../../src/index.js';

/**
 * Unit test for `MessageEnvelope`.
 *
 * The envelope wraps a `ProducibleMessage` (the producer-side builder)
 * and adds the state a message accumulates as it moves through the
 * system: destination queue, consumer group ID, status, and a
 * `MessageState`.
 *
 * Contract shape (the two facts that matter most):
 *
 *   - `getId()` delegates to `messageState.getId()`. Replacing the state
 *     via `setMessageState` replaces the ID.
 *   - The envelope's `destinationQueue` is independent of the underlying
 *     producible message's `queue`. Neither propagates to the other.
 */

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('MessageEnvelope — construction', () => {
  it('constructs from a bare ProducibleMessage with no preconditions', () => {
    // The constructor reads only `getScheduledDelay()` from the producible
    // message. It does not require a queue, exchange, body, or any other
    // field.
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());

    expect(typeof env.getId()).toBe('string');
    expect(env.getId().length).toBeGreaterThan(0);
    expect(env.getStatus()).toBe(EMessagePropertyStatus.NEW);
    expect(env.getConsumerGroupId()).toBe(null);
  });

  it('assigns distinct IDs to distinct envelopes', () => {
    // The ID comes from a fresh `MessageState`, whose constructor generates
    // a UUID. Two envelopes built from two messages have two distinct IDs.
    const a = new MessageEnvelope(RedisSMQ.newProducibleMessage());
    const b = new MessageEnvelope(RedisSMQ.newProducibleMessage());

    expect(a).not.toBe(b);
    expect(a.getId()).not.toBe(b.getId());
  });

  it('seeds effectiveScheduledDelay from the producible message', () => {
    // The constructor copies `scheduledDelay` into the message state's
    // `effectiveScheduledDelay`. This is what makes `hasNextDelay()`
    // return true for a delayed-but-not-yet-scheduled message.
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setScheduledDelay(5000),
    );

    expect(env.getMessageState().getEffectiveScheduledDelay()).toBe(5000);
    expect(env.hasNextDelay()).toBe(true);
  });

  it('does NOT seed effectiveScheduledDelay when scheduledDelay is 0', () => {
    // The constructor guards with `if (scheduledDelay)`, which treats 0 as
    // falsy. A message with `scheduledDelay(0)` — a legal value — is not
    // "delayed" from the envelope's point of view.
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setScheduledDelay(0),
    );

    expect(env.getMessageState().getEffectiveScheduledDelay()).toBe(0);
    expect(env.hasNextDelay()).toBe(false);
  });

  it('accepts an explicit MessageState and adopts its ID', () => {
    const state = new MessageState().setId('explicit-id');
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage(), state);

    expect(env.getMessageState()).toBe(state);
    expect(env.getId()).toBe('explicit-id');
  });

  it('accepts an explicit initial status', () => {
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage(),
      null,
      EMessagePropertyStatus.PENDING,
    );

    expect(env.getStatus()).toBe(EMessagePropertyStatus.PENDING);
  });
});

// ---------------------------------------------------------------------------
// Destination queue
// ---------------------------------------------------------------------------

describe('MessageEnvelope — destination queue', () => {
  it('throws MessageDestinationQueueRequiredError when read before being set', () => {
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());

    expect(() => env.getDestinationQueue()).toThrow(
      errors.MessageDestinationQueueRequiredError,
    );
  });

  it('returns the same object reference that was passed in', () => {
    // `setDestinationQueue` stores the argument by reference; the getter
    // returns that same reference. `toBe` (identity) is the correct
    // assertion — `toEqual` would also pass if the setter had cloned the
    // queue, which would be a different (and observable) contract.
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());
    const queue = { ns: 'ns1', name: 'queue1' };

    env.setDestinationQueue(queue);

    expect(env.getDestinationQueue()).toBe(queue);
  });

  it('returns `this` from setDestinationQueue for chaining', () => {
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());

    const result = env.setDestinationQueue({ ns: 'ns1', name: 'queue1' });

    expect(result).toBe(env);
  });

  it('throws MessageDestinationQueueAlreadySetError when set twice', () => {
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());
    env.setDestinationQueue({ ns: 'ns1', name: 'queue1' });

    expect(() =>
      env.setDestinationQueue({ ns: 'ns1', name: 'queue2' }),
    ).toThrow(errors.MessageDestinationQueueAlreadySetError);
  });

  it('preserves the original destination after a failed second set', () => {
    // The setter checks the "already set" condition before mutating, so a
    // failed second call leaves the first value intact.
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());
    const original = { ns: 'ns1', name: 'queue1' };
    env.setDestinationQueue(original);

    expect(() =>
      env.setDestinationQueue({ ns: 'ns2', name: 'queue2' }),
    ).toThrow(errors.MessageDestinationQueueAlreadySetError);

    expect(env.getDestinationQueue()).toBe(original);
  });

  it('does not write the destination through to the producible message', () => {
    // The envelope's destination and the producible message's queue are
    // separate fields. Setting the envelope's destination must leave the
    // underlying message untouched.
    const msg = RedisSMQ.newProducibleMessage();
    const env = new MessageEnvelope(msg);

    env.setDestinationQueue({ ns: 'ns1', name: 'queue1' });

    expect(msg.getQueue()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Status and consumer group ID
// ---------------------------------------------------------------------------

describe('MessageEnvelope — status and consumer group', () => {
  it('defaults status to NEW', () => {
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());
    expect(env.getStatus()).toBe(EMessagePropertyStatus.NEW);
  });

  it('setStatus updates the status', () => {
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());

    env.setStatus(EMessagePropertyStatus.PROCESSING);

    expect(env.getStatus()).toBe(EMessagePropertyStatus.PROCESSING);
  });

  it('defaults consumerGroupId to null', () => {
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());
    expect(env.getConsumerGroupId()).toBe(null);
  });

  it('setConsumerGroupId updates the group ID', () => {
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());

    env.setConsumerGroupId('g1');

    expect(env.getConsumerGroupId()).toBe('g1');
  });
});

// ---------------------------------------------------------------------------
// MessageState delegation
// ---------------------------------------------------------------------------

describe('MessageEnvelope — message state', () => {
  it('getMessageState returns the state the constructor created', () => {
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());
    const state = env.getMessageState();

    expect(state).toBeInstanceOf(MessageState);
    // `getId()` delegates to `messageState.getId()`.
    expect(env.getId()).toBe(state.getId());
  });

  it('setMessageState replaces the state and thereby the ID', () => {
    // Because `getId()` delegates to the state, replacing the state
    // through `setMessageState` mints a new identity for the envelope.
    // This is the mechanism RedisSMQ uses when reconstructing an
    // envelope from a Redis-stored message.
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());
    const originalId = env.getId();

    const replacement = new MessageState().setId('replacement-id');
    env.setMessageState(replacement);

    expect(env.getMessageState()).toBe(replacement);
    expect(env.getId()).toBe('replacement-id');
    expect(env.getId()).not.toBe(originalId);
  });
});

// ---------------------------------------------------------------------------
// Scheduling predicates and next-timestamp
// ---------------------------------------------------------------------------

describe('MessageEnvelope — scheduling', () => {
  it('hasNextDelay reflects the message state, not the producible message', () => {
    // `hasNextDelay` reads `messageState.hasDelay()`, which is true when
    // `effectiveScheduledDelay > 0`. The producible message's
    // `scheduledDelay` field is only consulted at construction, to seed
    // the state. After that, the state is the source of truth.
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setScheduledDelay(1000),
    );

    expect(env.hasNextDelay()).toBe(true);

    // Consume the delay via `getSetEffectiveScheduledDelay`, which is what
    // the scheduling worker does when it moves the message to the pending
    // queue.
    env.getMessageState().getSetEffectiveScheduledDelay();

    expect(env.hasNextDelay()).toBe(false);
  });

  it('isPeriodic is true when a CRON expression is set', () => {
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setScheduledCRON('* * * * * *'),
    );

    expect(env.isPeriodic()).toBe(true);
  });

  it('isPeriodic is true when scheduledRepeat > 0', () => {
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setScheduledRepeat(1),
    );

    expect(env.isPeriodic()).toBe(true);
  });

  it('isPeriodic is false when scheduledRepeat is 0', () => {
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setScheduledRepeat(0),
    );

    expect(env.isPeriodic()).toBe(false);
  });

  it('isPeriodic is false when neither CRON nor repeat is set', () => {
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());

    expect(env.isPeriodic()).toBe(false);
  });

  it('isSchedulable is the union of hasNextDelay and isPeriodic', () => {
    // Four combinations, each asserted explicitly so a regression in the
    // union logic names the combination that broke.
    const plainEnv = new MessageEnvelope(RedisSMQ.newProducibleMessage());
    expect(plainEnv.isSchedulable()).toBe(false);

    const delayedEnv = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setScheduledDelay(1000),
    );
    expect(delayedEnv.isSchedulable()).toBe(true);

    const cronEnv = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setScheduledCRON('* * * * * *'),
    );
    expect(cronEnv.isSchedulable()).toBe(true);

    const bothEnv = new MessageEnvelope(
      RedisSMQ.newProducibleMessage()
        .setScheduledDelay(1000)
        .setScheduledCRON('* * * * * *'),
    );
    expect(bothEnv.isSchedulable()).toBe(true);
  });

  it('getNextScheduledTimestamp returns 0 for a non-schedulable message', () => {
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());

    expect(env.getNextScheduledTimestamp()).toBe(0);
  });

  it('getNextScheduledTimestamp returns now + delay for a delayed message', () => {
    // The delay path returns `now + effectiveScheduledDelay`. The
    // timestamp is not deterministic (depends on the wall clock) so the
    // assertion is a bounded-range check rather than an exact value.
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setScheduledDelay(5000),
    );

    const before = Date.now();
    const ts = env.getNextScheduledTimestamp();
    const after = Date.now();

    expect(ts).toBeGreaterThanOrEqual(before + 5000);
    expect(ts).toBeLessThanOrEqual(after + 5000);
  });

  it('getNextScheduledTimestamp consumes the effective delay on the first call', () => {
    // `getNextScheduledTimestamp` calls
    // `messageState.getSetEffectiveScheduledDelay()`, which returns the
    // delay and resets it to 0. A second call therefore finds the message
    // no longer schedulable (no delay, no cron, no repeat) and returns 0.
    //
    // This statefulness is worth pinning: it means the method is not a
    // pure getter, and callers that inspect the timestamp for
    // observability purposes will change the message's scheduling state
    // as a side effect.
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setScheduledDelay(5000),
    );

    expect(env.getNextScheduledTimestamp()).toBeGreaterThan(0);
    expect(env.getNextScheduledTimestamp()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Retry threshold
// ---------------------------------------------------------------------------

describe('MessageEnvelope — hasRetryThresholdExceeded', () => {
  it('is false below the threshold', () => {
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setRetryThreshold(3),
    );

    env.getMessageState().setAttempts(2);
    expect(env.hasRetryThresholdExceeded()).toBe(false);
  });

  it('is true at the threshold', () => {
    // The comparison is `attempts >= threshold`, so it flips at the
    // threshold itself, not one past it. With `retryThreshold: 3`, the
    // third attempt already counts as "exceeded".
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setRetryThreshold(3),
    );

    env.getMessageState().setAttempts(3);
    expect(env.hasRetryThresholdExceeded()).toBe(true);
  });

  it('is true above the threshold', () => {
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setRetryThreshold(3),
    );

    env.getMessageState().setAttempts(4);
    expect(env.hasRetryThresholdExceeded()).toBe(true);
  });

  it('is true immediately when retryThreshold is 0', () => {
    // Threshold 0 means "no retries". With zero attempts, `0 >= 0` is
    // true, so the very first failure dead-letters.
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setRetryThreshold(0),
    );

    expect(env.getMessageState().getAttempts()).toBe(0);
    expect(env.hasRetryThresholdExceeded()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Expiration
// ---------------------------------------------------------------------------

describe('MessageEnvelope — getSetExpired', () => {
  it('returns false for a message with no TTL', () => {
    // With ttl=0, `MessageState.getSetExpired` skips the expiry
    // computation entirely and returns the existing `expired` flag,
    // which defaults to false.
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());

    expect(env.getSetExpired()).toBe(false);
  });

  it('returns false for a message whose TTL has not elapsed', () => {
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setTTL(60_000),
    );

    expect(env.getSetExpired()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

describe('MessageEnvelope — serialization', () => {
  it('toJSON throws when the destination queue has not been set', () => {
    // `toJSON` calls `this.getDestinationQueue()` unconditionally, so an
    // envelope without a destination cannot be serialized. This is the
    // right contract — a message without a destination is not deliverable
    // — but it is worth pinning so a future change that makes toJSON
    // tolerant of a missing destination is caught and considered.
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());

    expect(() => env.toJSON()).toThrow(
      errors.MessageDestinationQueueRequiredError,
    );
  });

  it('toJSON returns both the producible message queue and the destination queue', () => {
    // The two are separate fields, both present in the output. `queue`
    // reflects what was set on the producible message; `destinationQueue`
    // reflects what was set on the envelope. They can differ.
    const msg = RedisSMQ.newProducibleMessage()
      .setQueue({ ns: 'ns1', name: 'from-message' })
      .setBody({ hello: 'world' });
    const env = new MessageEnvelope(msg);
    env.setDestinationQueue({ ns: 'ns2', name: 'from-envelope' });

    const json = env.toJSON();

    expect(json.queue).toEqual({ ns: 'ns1', name: 'from-message' });
    expect(json.destinationQueue).toEqual({
      ns: 'ns2',
      name: 'from-envelope',
    });
    expect(json.body).toEqual({ hello: 'world' });
  });

  it('transfer includes id, messageState, and status in addition to the JSON fields', () => {
    const msg = RedisSMQ.newProducibleMessage().setBody('payload');
    const env = new MessageEnvelope(msg);
    env.setDestinationQueue({ ns: 'ns1', name: 'queue1' });
    env.setStatus(EMessagePropertyStatus.PENDING);

    const transferable = env.transfer();

    expect(transferable.id).toBe(env.getId());
    expect(transferable.status).toBe(EMessagePropertyStatus.PENDING);
    expect(transferable.messageState).toEqual(env.getMessageState().toJSON());
    expect(transferable.body).toBe('payload');
    expect(transferable.destinationQueue).toEqual({
      ns: 'ns1',
      name: 'queue1',
    });
  });

  it('toString serializes the envelope as JSON', () => {
    // `toString` is `JSON.stringify(this)`. Because `MessageEnvelope`
    // defines a `toJSON` method, `JSON.stringify` invokes it and
    // serializes its return value. The observable consequence: the string
    // is the same JSON `toJSON()` would produce.
    const env = new MessageEnvelope(
      RedisSMQ.newProducibleMessage().setBody('payload'),
    );
    env.setDestinationQueue({ ns: 'ns1', name: 'queue1' });

    const s = env.toString();

    expect(typeof s).toBe('string');
    expect(JSON.parse(s).body).toBe('payload');
    expect(JSON.parse(s).destinationQueue).toEqual({
      ns: 'ns1',
      name: 'queue1',
    });
  });

  it('toString throws when the destination queue has not been set', () => {
    // Because `toString` routes through `toJSON`, it inherits `toJSON`'s
    // requirement that the destination be set. A caller who tries to log
    // a half-constructed envelope hits the same error as one who tries to
    // serialize it. Worth pinning so the coupling between the two methods
    // is explicit.
    const env = new MessageEnvelope(RedisSMQ.newProducibleMessage());

    expect(() => env.toString()).toThrow(
      errors.MessageDestinationQueueRequiredError,
    );
  });
});
