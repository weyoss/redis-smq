/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  EExchangeType,
  EMessagePriority,
  errors,
  RedisSMQ,
} from '../../../src/index.js';

/**
 * Unit test for `ProducibleMessage`.
 *
 * `ProducibleMessage` is the producer-side message builder: it accumulates
 * the fields a caller sets (`body`, queue or exchange target, retry policy,
 * scheduling parameters) and validates them at set time. It is a plain
 * class — no Redis, no I/O, and no shared state between instances.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type TProducibleMessage = ReturnType<typeof RedisSMQ.newProducibleMessage>;
type TSetter = (msg: TProducibleMessage) => void;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProducibleMessage', () => {
  let currentNs: string;

  beforeEach(() => {
    // Read the namespace from the config manager — the same source
    // `setQueue` and the exchange setters use to prefix bare names.
    currentNs = RedisSMQ.createConfigManager().getConfig().namespace;
  });

  // -------------------------------------------------------------------------
  // Numeric property validation
  // -------------------------------------------------------------------------

  describe('numeric property validation', () => {
    it.each<[string, TSetter]>([
      ['setScheduledRepeatPeriod', (msg) => msg.setScheduledRepeatPeriod(-1)],
      ['setScheduledDelay', (msg) => msg.setScheduledDelay(-1)],
      ['setScheduledRepeat', (msg) => msg.setScheduledRepeat(-1)],
      ['setTTL', (msg) => msg.setTTL(-1)],
      ['setConsumeTimeout', (msg) => msg.setConsumeTimeout(-1)],
      ['setRetryThreshold', (msg) => msg.setRetryThreshold(-1)],
      ['setRetryDelay', (msg) => msg.setRetryDelay(-1)],
    ])('%s rejects negative values', (_name, setter) => {
      const msg = RedisSMQ.newProducibleMessage();
      expect(() => setter(msg)).toThrow(
        errors.MessagePropertyInvalidValueError,
      );
    });

    it.each<[string, TSetter]>([
      ['setScheduledRepeatPeriod', (msg) => msg.setScheduledRepeatPeriod(0)],
      ['setScheduledDelay', (msg) => msg.setScheduledDelay(0)],
      ['setScheduledRepeat', (msg) => msg.setScheduledRepeat(0)],
      ['setTTL', (msg) => msg.setTTL(0)],
      ['setConsumeTimeout', (msg) => msg.setConsumeTimeout(0)],
      ['setRetryThreshold', (msg) => msg.setRetryThreshold(0)],
      ['setRetryDelay', (msg) => msg.setRetryDelay(0)],
    ])('%s accepts zero', (_name, setter) => {
      // Zero is the sentinel for "not set" / "no limit" on every one of
      // these fields. A validation change that tightened the lower bound
      // to `> 0` would silently break every default-configured message.
      const msg = RedisSMQ.newProducibleMessage();
      expect(() => setter(msg)).not.toThrow();
    });

    it.each<[string, TSetter]>([
      ['setScheduledRepeatPeriod', (msg) => msg.setScheduledRepeatPeriod(1000)],
      ['setScheduledDelay', (msg) => msg.setScheduledDelay(1000)],
      ['setScheduledRepeat', (msg) => msg.setScheduledRepeat(5)],
      ['setTTL', (msg) => msg.setTTL(60_000)],
      ['setConsumeTimeout', (msg) => msg.setConsumeTimeout(5000)],
      ['setRetryThreshold', (msg) => msg.setRetryThreshold(3)],
      ['setRetryDelay', (msg) => msg.setRetryDelay(1000)],
    ])('%s accepts positive values', (_name, setter) => {
      const msg = RedisSMQ.newProducibleMessage();
      expect(() => setter(msg)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Priority
  // -------------------------------------------------------------------------

  describe('priority', () => {
    it('starts with no priority set', () => {
      const msg = RedisSMQ.newProducibleMessage();
      expect(msg.hasPriority()).toBe(false);
      expect(msg.getPriority()).toBe(null);
    });

    it('sets and reports the priority', () => {
      const msg = RedisSMQ.newProducibleMessage();
      msg.setPriority(EMessagePriority.HIGHEST);

      expect(msg.getPriority()).toBe(EMessagePriority.HIGHEST);
      expect(msg.hasPriority()).toBe(true);
    });

    it('clears the priority when disabled', () => {
      const msg = RedisSMQ.newProducibleMessage();
      msg.setPriority(EMessagePriority.HIGHEST);

      msg.disablePriority();

      expect(msg.getPriority()).toBe(null);
      expect(msg.hasPriority()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Exchanges
  // -------------------------------------------------------------------------

  describe('exchanges', () => {
    it.each<[string, TSetter, string, EExchangeType]>([
      [
        'setDirectExchange',
        (msg) => msg.setDirectExchange('my-direct'),
        'my-direct',
        EExchangeType.DIRECT,
      ],
      [
        'setTopicExchange',
        (msg) => msg.setTopicExchange('my-topic'),
        'my-topic',
        EExchangeType.TOPIC,
      ],
      [
        'setFanoutExchange',
        (msg) => msg.setFanoutExchange('my-fanout'),
        'my-fanout',
        EExchangeType.FANOUT,
      ],
    ])(
      '%s sets the exchange type and clears the queue',
      (_name, setter, exchangeName, expectedType) => {
        const msg = RedisSMQ.newProducibleMessage();
        setter(msg);

        // A message is addressed to either a queue or an exchange, never
        // both. Setting an exchange target must clear any prior queue.
        expect(msg.getQueue()).toBeNull();
        expect(msg.getExchange()).toEqual({
          ns: currentNs,
          name: exchangeName,
          type: expectedType,
        });
      },
    );

    it('replaces a previously-set exchange when a different one is set', () => {
      // The original test moved direct → topic → fanout and asserted on
      // each. Splitting that sequence into a single round-trip test keeps
      // the coverage without coupling the fanout assertion to the direct
      // and topic ones.
      const msg = RedisSMQ.newProducibleMessage();

      msg.setDirectExchange('direct');
      msg.setTopicExchange('topic');
      msg.setFanoutExchange('fanout');

      expect(msg.getExchange()).toEqual({
        ns: currentNs,
        name: 'fanout',
        type: EExchangeType.FANOUT,
      });
    });
  });

  // -------------------------------------------------------------------------
  // Queue
  // -------------------------------------------------------------------------

  describe('queue', () => {
    it('setQueue with a bare name uses the current namespace', () => {
      const msg = RedisSMQ.newProducibleMessage();
      msg.setQueue('my-queue');

      expect(msg.getQueue()).toEqual({ ns: currentNs, name: 'my-queue' });
      expect(msg.getExchange()).toBeNull();
    });

    it('setQueue with explicit IQueueParams preserves the given namespace', () => {
      // The bare-name form prefixes with the current namespace; the object
      // form must NOT be re-prefixed, or a caller targeting a custom
      // namespace would silently end up on the test namespace instead.
      const msg = RedisSMQ.newProducibleMessage();
      const queue = { ns: 'custom-ns', name: 'my-queue' };

      msg.setQueue(queue);

      expect(msg.getQueue()).toEqual(queue);
    });

    it('setQueue overrides a previously-set queue', () => {
      const msg = RedisSMQ.newProducibleMessage();
      msg.setQueue('first');
      msg.setQueue('second');

      expect(msg.getQueue()).toEqual({ ns: currentNs, name: 'second' });
    });

    it('setQueue clears a previously-set exchange', () => {
      const msg = RedisSMQ.newProducibleMessage();
      msg.setDirectExchange('ex');

      msg.setQueue('my-queue');

      expect(msg.getExchange()).toBeNull();
      expect(msg.getQueue()).toEqual({ ns: currentNs, name: 'my-queue' });
    });
  });

  // -------------------------------------------------------------------------
  // Fluent chaining
  // -------------------------------------------------------------------------

  describe('fluent chaining', () => {
    it('setters return the message for fluent composition', () => {
      // Used throughout the integration tests, where a message is built as
      // `RedisSMQ.newProducibleMessage().setQueue(...).setBody(...)`. If a
      // setter ever returned `void` or a copy, every chained call site would
      // break — this test pins the contract.
      const msg = RedisSMQ.newProducibleMessage();

      const result = msg
        .setBody({ hello: 'world' })
        .setQueue('my-queue')
        .setRetryThreshold(3)
        .setRetryDelay(1000);

      expect(result).toBe(msg);
    });
  });

  // -------------------------------------------------------------------------
  // Factory
  // -------------------------------------------------------------------------

  describe('RedisSMQ.newProducibleMessage', () => {
    it('returns a fresh, independent instance on each call', () => {
      // Two instances must not share state. If the factory returned a
      // cached singleton, a test setting a queue on one message would leak
      // the queue into the next test's message.
      const a = RedisSMQ.newProducibleMessage();
      const b = RedisSMQ.newProducibleMessage();

      expect(a).not.toBe(b);

      a.setQueue('a-queue');
      expect(b.getQueue()).toBeNull();
    });
  });
});
