/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EQueueType,
  errors,
  type IMessageTransferable,
} from '../../../src/index.js';
import { createBareConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';

/**
 * Integration tests for message-handler signature validation.
 *
 * `consumer.consume(queue, handler)` accepts three handler shapes:
 *
 *   1. A callback-style function:  `(msg, cb) => void`      — arity 2
 *   2. A promise-style function:   `(msg) => Promise<void>` — arity 1
 *   3. A module path (string):     `'./handlers/foo.js'`
 *
 * The validator inspects arity, not the return type. The exact rule in
 * `MessageConsumer.validateHandler`:
 *
 *   - `typeof handler === 'function'` and `handler.length ∈ {1, 2}`:
 *     accepted.
 *   - `typeof handler === 'function'` and arity is anything else:
 *     rejected with `InvalidMessageHandlerSignatureError`.
 *   - `typeof handler === 'string'`: validated as a file path — that
 *     path is exercised in `file-based-handler-errors.test.ts`.
 *   - Any other `typeof`: rejected with `InvalidMessageHandlerTypeError`.
 *
 * The two error classes are distinct on purpose. A SignatureError means
 * "a handler was provided, but its shape is wrong" — usually a coding
 * mistake. A TypeError means "the thing passed as a handler is not a
 * handler at all" — usually a lost reference in a caller that stored
 * handlers in a map or config object. Callers can react to the two
 * differently.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Message handler signature validation', () => {
  // -------------------------------------------------------------------------
  // Baseline — accepted arities
  // -------------------------------------------------------------------------

  describe('accepted arities', () => {
    it('accepts a one-parameter function', async () => {
      const queue = uniqueQueue('sig-arity-1');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.run();

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        consumer.consume(queue, (_msg: IMessageTransferable) => undefined),
      ).resolves.toBeUndefined();
    });

    it('accepts a two-parameter function', async () => {
      const queue = uniqueQueue('sig-arity-2');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.run();

      await expect(
        consumer.consume(queue, (_msg: IMessageTransferable, cb: ICallback) =>
          cb(),
        ),
      ).resolves.toBeUndefined();
    });

    it('accepts an async one-parameter function', async () => {
      const queue = uniqueQueue('sig-arity-1-async');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.run();

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        consumer.consume(queue, async (_msg: IMessageTransferable) => {
          // Intentionally empty — the handler is never invoked in this
          // test; the assertion is on registration acceptance.
        }),
      ).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Rejected arities
  // -------------------------------------------------------------------------

  describe('rejected arities', () => {
    it.each<[string, unknown]>([
      ['zero parameters', () => undefined],
      [
        'three parameters',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (_a: unknown, _b: unknown, _c: unknown) => undefined,
      ],
      [
        'four parameters',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (_a: unknown, _b: unknown, _c: unknown, _d: unknown) => undefined,
      ],
      ['an async zero-parameter function', async () => undefined],
    ])(
      'rejects a function with %s with InvalidMessageHandlerSignatureError',
      async (_label, handler) => {
        // Each row provides a fresh function literal, so no row can
        // accidentally share a function reference with another. This
        // would matter if a future refactor keyed a registry by handler
        // identity — today it is just defensive hygiene.
        const queue = uniqueQueue('sig-bad-arity');
        await createQueue(queue, EQueueType.FIFO_QUEUE);

        const consumer = createBareConsumer();
        await consumer.run();

        await expect(consumer.consume(queue, handler as never)).rejects.toThrow(
          errors.InvalidMessageHandlerSignatureError,
        );

        // A rejected registration must not leave a partial entry behind.
        // The runner's `runMessageHandler` failure path calls
        // `removeMessageHandler`, which removes the config before
        // propagating the error — so the queue list is empty afterward.
        expect(consumer.getQueues()).toEqual([]);
      },
    );
  });

  // -------------------------------------------------------------------------
  // Non-function inputs
  // -------------------------------------------------------------------------

  describe('non-function inputs', () => {
    it.each<[string, unknown]>([
      ['null', null],
      ['undefined', undefined],
      ['a number', 42],
      ['a boolean', true],
      ['a plain object', {}],
      ['a symbol', Symbol('handler')],
    ])(
      'rejects %s with InvalidMessageHandlerTypeError',
      async (_label, handler) => {
        // The TypeScript signature forbids these inputs, so the cast
        // `as never` below is required to reach the test body. They are
        // included because RedisSMQ distinguishes them from
        // wrong-arity functions and because a JavaScript caller (or a
        // future loosening of the type) would reach them at runtime.
        const queue = uniqueQueue('sig-bad-type');
        await createQueue(queue, EQueueType.FIFO_QUEUE);

        const consumer = createBareConsumer();
        await consumer.run();

        await expect(consumer.consume(queue, handler as never)).rejects.toThrow(
          errors.InvalidMessageHandlerTypeError,
        );

        expect(consumer.getQueues()).toEqual([]);
      },
    );
  });

  // -------------------------------------------------------------------------
  // When validation runs
  // -------------------------------------------------------------------------

  describe('when validation runs', () => {
    it('defers validation to run() when consume() is called before the consumer is running', async () => {
      const queue = uniqueQueue('sig-deferred');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();

      // No `run()` yet — registration succeeds despite the bad handler.
      await expect(
        consumer.consume(queue, (() => undefined) as never),
      ).resolves.toBeUndefined();

      // Now start the consumer. Validation fires, the handler startup
      // fails, and the error propagates through `run()`.
      await expect(consumer.run()).rejects.toThrow(
        errors.InvalidMessageHandlerSignatureError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Recovery
  // -------------------------------------------------------------------------

  describe('recovery', () => {
    it('allows registering a valid handler after a rejected one', async () => {
      const queueBad = uniqueQueue('sig-recover-bad');
      const queueGood = uniqueQueue('sig-recover-good');
      await createQueue(queueBad, EQueueType.FIFO_QUEUE);
      await createQueue(queueGood, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.run();

      await expect(
        consumer.consume(queueBad, (() => undefined) as never),
      ).rejects.toThrow(errors.InvalidMessageHandlerSignatureError);

      await expect(
        consumer.consume(
          queueGood,
          (_msg: IMessageTransferable, cb: ICallback) => cb(),
        ),
      ).resolves.toBeUndefined();

      // Only the good queue is registered. The bad one left no trace.
      const registered = consumer
        .getQueues()
        .map((entry) => entry.queueParams.name);
      expect(registered).toEqual([queueGood.name]);
    });
  });
});
