/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import {
  EExchangeQueuePolicy,
  EExchangeType,
  EQueueType,
  RedisSMQ,
  type IExchangeParsedParams,
  type IQueueParams,
  errors,
} from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { makeQueues, sortQueues } from '../../helpers/factories/exchange.js';

/**
 * Integration tests for `ExchangeManager`.
 *
 * The manager is the type-parameterized surface for exchange
 * operations: callers who carry the exchange type as a runtime value
 * use it, and the three concrete facades (`ExchangeDirect`,
 * `ExchangeTopic`, `ExchangeFanout`) delegate to it.
 *
 * The exchange's type is a property of the exchange, not of the call.
 * Only `create` takes a type; every other operation reads the stored
 * type from Redis and dispatches internally.
 *
 * SCOPE:
 *
 *   - Lifecycle: `create`, `delete`, `exists`, `getProperties`.
 *   - `bindQueue` against an existing exchange; the missing-exchange
 *     rejection; the arity check against the stored type.
 *   - `bindQueue`/`unbindQueue` behavior: idempotency, multi-binding,
 *     namespace and queue preconditions.
 *   - `matchQueues` for all three exchange types and the arity
 *     enforcement around the routing key.
 *   - `getBindings`, `getBindingQueues`, and the three type-specific
 *     reads.
 *   - Discovery: `getAllExchanges`, `getNamespaceExchanges`,
 *     `getQueueExchanges`.
 *
 * OUT OF SCOPE:
 *
 *   - The three concrete facades. Their behavior is covered in the
 *     sibling files (`direct/*`, `topic/*`, `fanout/*`). Those tests
 *     still exercise the manager through the facades; this file
 *     exercises the manager directly.
 *   - The strategy implementations in isolation.
 *   - Producer-side exchange routing
 *     (`publishing/publish-via-exchange.test.ts`).
 *
 * Every test creates its own uniquely-named queue and exchange. The
 * per-test `flushAll` in `tests/setup/per-test.ts` wipes Redis between
 * tests, so `getAllExchanges` inside a single `it` sees only what that
 * test created.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * A fixture with a queue and the params for an exchange in the same
 * namespace. The exchange is not created — callers that need it call
 * `create` explicitly.
 */
interface IExchangeFixture {
  queue: IQueueParams;
  exchange: { ns: string; name: string };
}

async function makeFixture(prefix: string): Promise<IExchangeFixture> {
  const queue = uniqueQueue(prefix);
  await createQueue(queue);
  return {
    queue,
    exchange: { ns: queue.ns, name: `ex-${queue.name}` },
  };
}

/**
 * A fixture with a queue and an existing exchange of the given type.
 * The queue policy is STANDARD, which matches the FIFO queue the
 * fixture creates.
 */
async function makeCreatedFixture(
  prefix: string,
  type: EExchangeType,
): Promise<IExchangeFixture> {
  const fixture = await makeFixture(prefix);
  const mgr = RedisSMQ.createExchangeManager();
  await mgr.create(fixture.exchange, type, EExchangeQueuePolicy.STANDARD);
  return fixture;
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

describe('ExchangeManager — create', () => {
  it('creates a direct exchange and records its type and queue policy', async () => {
    const { exchange } = await makeFixture('mgr-create-direct');
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.create(
      exchange,
      EExchangeType.DIRECT,
      EExchangeQueuePolicy.STANDARD,
    );

    const props = await mgr.getProperties(exchange);
    expect(props.type).toBe(EExchangeType.DIRECT);
    expect(props.queuePolicy).toBe(EExchangeQueuePolicy.STANDARD);
  });

  it('creates a topic exchange with the priority queue policy', async () => {
    const { exchange } = await makeFixture('mgr-create-topic');
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.create(
      exchange,
      EExchangeType.TOPIC,
      EExchangeQueuePolicy.PRIORITY,
    );

    const props = await mgr.getProperties(exchange);
    expect(props.type).toBe(EExchangeType.TOPIC);
    expect(props.queuePolicy).toBe(EExchangeQueuePolicy.PRIORITY);
  });

  it('rejects a second create with ExchangeAlreadyExistsError', async () => {
    const { exchange } = await makeFixture('mgr-create-dup');
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.create(
      exchange,
      EExchangeType.DIRECT,
      EExchangeQueuePolicy.STANDARD,
    );

    await expect(
      mgr.create(exchange, EExchangeType.DIRECT, EExchangeQueuePolicy.STANDARD),
    ).rejects.toThrow(errors.ExchangeAlreadyExistsError);
  });

  it('does not modify the exchange on a rejected second create', async () => {
    // The second create attempts a different type. If the framework
    // applied the new parameters before checking for existence, the
    // stored type would be TOPIC.
    const { exchange } = await makeFixture('mgr-create-no-mutate');
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.create(
      exchange,
      EExchangeType.DIRECT,
      EExchangeQueuePolicy.STANDARD,
    );

    await expect(
      mgr.create(exchange, EExchangeType.TOPIC, EExchangeQueuePolicy.STANDARD),
    ).rejects.toThrow(errors.ExchangeAlreadyExistsError);

    const props = await mgr.getProperties(exchange);
    expect(props.type).toBe(EExchangeType.DIRECT);
  });
});

describe('ExchangeManager — delete', () => {
  it('deletes an exchange that has no bound queues', async () => {
    const { exchange } = await makeCreatedFixture(
      'mgr-delete-clean',
      EExchangeType.DIRECT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.delete(exchange);

    await expect(mgr.getProperties(exchange)).rejects.toThrow(
      errors.ExchangeNotFoundError,
    );
  });

  it('rejects with ExchangeNotFoundError on a missing exchange', async () => {
    const { exchange } = await makeFixture('mgr-delete-missing');
    const mgr = RedisSMQ.createExchangeManager();

    await expect(mgr.delete(exchange)).rejects.toThrow(
      errors.ExchangeNotFoundError,
    );
  });

  it('rejects with ExchangeHasBoundQueuesError while a queue is bound', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-delete-blocked',
      EExchangeType.DIRECT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange, 'rk.a');

    await expect(mgr.delete(exchange)).rejects.toThrow(
      errors.ExchangeHasBoundQueuesError,
    );
  });

  it('succeeds after the last binding is removed', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-delete-after-unbind',
      EExchangeType.DIRECT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange, 'rk.a');
    await mgr.unbindQueue(queue, exchange, 'rk.a');
    await mgr.delete(exchange);

    await expect(mgr.getProperties(exchange)).rejects.toThrow(
      errors.ExchangeNotFoundError,
    );
  });

  it('rejects a second delete with ExchangeNotFoundError', async () => {
    const { exchange } = await makeCreatedFixture(
      'mgr-delete-twice',
      EExchangeType.DIRECT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.delete(exchange);

    await expect(mgr.delete(exchange)).rejects.toThrow(
      errors.ExchangeNotFoundError,
    );
  });
});

describe('ExchangeManager — exists', () => {
  it('returns true for an existing exchange', async () => {
    const { exchange } = await makeCreatedFixture(
      'mgr-exists-true',
      EExchangeType.DIRECT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    expect(await mgr.exists(exchange)).toBe(true);
  });

  it('returns false for a missing exchange without rejecting', async () => {
    const { exchange } = await makeFixture('mgr-exists-false');
    const mgr = RedisSMQ.createExchangeManager();

    expect(await mgr.exists(exchange)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// bindQueue — preconditions
// ---------------------------------------------------------------------------

describe('ExchangeManager — bindQueue preconditions', () => {
  it('rejects with ExchangeNotFoundError when the exchange does not exist', async () => {
    // The exchange must exist before a bind. Lazy creation is not part
    // of the contract: `create` is the operation that establishes an
    // exchange, and it is the only one that takes a type.
    const { queue, exchange } = await makeFixture('mgr-bind-missing-ex');
    const mgr = RedisSMQ.createExchangeManager();

    await expect(mgr.bindQueue(queue, exchange, 'rk.a')).rejects.toThrow(
      errors.ExchangeNotFoundError,
    );
  });

  it('rejects with ExchangeNotFoundError for a fanout bind on a missing exchange', async () => {
    const { queue, exchange } = await makeFixture('mgr-bind-missing-fanout');
    const mgr = RedisSMQ.createExchangeManager();

    await expect(mgr.bindQueue(queue, exchange)).rejects.toThrow(
      errors.ExchangeNotFoundError,
    );
  });

  it('rejects with NamespaceMismatchError for a cross-namespace bind', async () => {
    const queue = uniqueQueue('mgr-bind-cross');
    await createQueue(queue);

    const otherExchange = {
      ns: `${queue.ns}-other`,
      name: `ex-${queue.name}`,
    };
    const mgr = RedisSMQ.createExchangeManager();
    await mgr.create(
      otherExchange,
      EExchangeType.DIRECT,
      EExchangeQueuePolicy.STANDARD,
    );

    await expect(mgr.bindQueue(queue, otherExchange, 'rk.a')).rejects.toThrow(
      errors.NamespaceMismatchError,
    );
  });

  it('rejects with QueueNotFoundError for a missing queue', async () => {
    const existing = uniqueQueue('mgr-bind-missing-q');
    await createQueue(existing);

    const nonexistent: IQueueParams = {
      ns: existing.ns,
      name: `never-created-${Date.now()}`,
    };
    const exchange = { ns: existing.ns, name: `ex-${existing.name}` };
    const mgr = RedisSMQ.createExchangeManager();
    await mgr.create(
      exchange,
      EExchangeType.DIRECT,
      EExchangeQueuePolicy.STANDARD,
    );

    await expect(mgr.bindQueue(nonexistent, exchange, 'rk.a')).rejects.toThrow(
      errors.QueueNotFoundError,
    );
  });
});

// ---------------------------------------------------------------------------
// bindQueue — arity
// ---------------------------------------------------------------------------

describe('ExchangeManager — bindQueue arity', () => {
  it('rejects with InvalidExchangeParametersError when a fanout bind carries a binding', async () => {
    // The arity check runs against the exchange's stored type. A
    // fanout exchange forbids a binding; supplying one rejects before
    // any write.
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-bind-fanout-arity',
      EExchangeType.FANOUT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await expect(mgr.bindQueue(queue, exchange, 'rk.a')).rejects.toThrow(
      errors.InvalidExchangeParametersError,
    );
  });

  it('rejects with InvalidExchangeParametersError when a direct bind omits the binding', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-bind-direct-arity',
      EExchangeType.DIRECT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await expect(mgr.bindQueue(queue, exchange)).rejects.toThrow(
      errors.InvalidExchangeParametersError,
    );
  });

  it('rejects with InvalidExchangeParametersError when a topic bind omits the binding', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-bind-topic-arity',
      EExchangeType.TOPIC,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await expect(mgr.bindQueue(queue, exchange)).rejects.toThrow(
      errors.InvalidExchangeParametersError,
    );
  });
});

// ---------------------------------------------------------------------------
// bindQueue — behavior
// ---------------------------------------------------------------------------

describe('ExchangeManager — bindQueue behavior', () => {
  it('binds a queue to a direct exchange under a routing key', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-bind-direct',
      EExchangeType.DIRECT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange, 'rk.a');

    const bound = await mgr.getBindingQueues(exchange, 'rk.a');
    expect(bound).toEqual([queue]);
  });

  it('binds a queue to a topic exchange under a pattern', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-bind-topic',
      EExchangeType.TOPIC,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange, 'order.*');

    const bound = await mgr.getBindingQueues(exchange, 'order.*');
    expect(bound).toEqual([queue]);
  });

  it('binds a queue to a fanout exchange without a binding', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-bind-fanout',
      EExchangeType.FANOUT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange);

    const bound = await mgr.getBoundQueues(exchange);
    expect(bound).toEqual([queue]);
  });

  it('is idempotent for the same queue and routing key', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-bind-idempotent',
      EExchangeType.DIRECT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange, 'rk.a');
    await expect(
      mgr.bindQueue(queue, exchange, 'rk.a'),
    ).resolves.toBeUndefined();

    const bound = await mgr.getBindingQueues(exchange, 'rk.a');
    expect(bound).toEqual([queue]);
  });

  it('allows binding the same queue under multiple routing keys', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-bind-multi',
      EExchangeType.DIRECT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange, 'rk.a');
    await mgr.bindQueue(queue, exchange, 'rk.b');

    const underA = await mgr.getBindingQueues(exchange, 'rk.a');
    const underB = await mgr.getBindingQueues(exchange, 'rk.b');
    expect(underA).toEqual([queue]);
    expect(underB).toEqual([queue]);

    const keys = await mgr.getRoutingKeys(exchange);
    expect([...keys].sort()).toEqual(['rk.a', 'rk.b']);
  });

  it('allows binding two queues under the same routing key', async () => {
    const { exchange } = await makeCreatedFixture(
      'mgr-bind-multi-q',
      EExchangeType.DIRECT,
    );
    const [qA, qB] = await makeQueues('mgr-bind-multi-q', 2);
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(qA, exchange, 'rk.a');
    await mgr.bindQueue(qB, exchange, 'rk.a');

    const bound = await mgr.getBindingQueues(exchange, 'rk.a');
    expect(sortQueues(bound)).toEqual(sortQueues([qA, qB]));
  });
});

// ---------------------------------------------------------------------------
// unbindQueue
// ---------------------------------------------------------------------------

describe('ExchangeManager — unbindQueue', () => {
  it('removes a direct binding', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-unbind-direct',
      EExchangeType.DIRECT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange, 'rk.a');
    await mgr.unbindQueue(queue, exchange, 'rk.a');

    expect(await mgr.getBindingQueues(exchange, 'rk.a')).toEqual([]);
  });

  it('removes a topic binding', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-unbind-topic',
      EExchangeType.TOPIC,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange, 'order.*');
    await mgr.unbindQueue(queue, exchange, 'order.*');

    expect(await mgr.getBindingQueues(exchange, 'order.*')).toEqual([]);
  });

  it('removes a fanout binding without a binding argument', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-unbind-fanout',
      EExchangeType.FANOUT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange);
    await mgr.unbindQueue(queue, exchange);

    expect(await mgr.getBoundQueues(exchange)).toEqual([]);
  });

  it('rejects with QueueNotBoundError when the binding does not exist', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-unbind-not-bound',
      EExchangeType.DIRECT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await expect(
      mgr.unbindQueue(queue, exchange, 'rk.missing'),
    ).rejects.toThrow(errors.QueueNotBoundError);
  });

  it('removes only the specified binding, leaving the others intact', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-unbind-partial',
      EExchangeType.DIRECT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange, 'rk.a');
    await mgr.bindQueue(queue, exchange, 'rk.b');

    await mgr.unbindQueue(queue, exchange, 'rk.a');

    expect(await mgr.getBindingQueues(exchange, 'rk.a')).toEqual([]);
    expect(await mgr.getBindingQueues(exchange, 'rk.b')).toEqual([queue]);
  });

  it('rejects with ExchangeNotFoundError on a missing exchange', async () => {
    const { queue, exchange } = await makeFixture('mgr-unbind-missing-ex');
    const mgr = RedisSMQ.createExchangeManager();

    await expect(mgr.unbindQueue(queue, exchange, 'rk.a')).rejects.toThrow(
      errors.ExchangeNotFoundError,
    );
  });
});

// ---------------------------------------------------------------------------
// matchQueues
// ---------------------------------------------------------------------------

describe('ExchangeManager — matchQueues', () => {
  it('resolves a routing key to bound queues for a direct exchange', async () => {
    const { exchange } = await makeCreatedFixture(
      'mgr-match-direct',
      EExchangeType.DIRECT,
    );
    const [qA, qB] = await makeQueues('mgr-match-direct-q', 2);
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(qA, exchange, 'rk.a');
    await mgr.bindQueue(qB, exchange, 'rk.a');

    const matched = await mgr.matchQueues(exchange, 'rk.a');
    expect(sortQueues(matched)).toEqual(sortQueues([qA, qB]));
  });

  it('does not match a routing key that no queue is bound under', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-match-miss',
      EExchangeType.DIRECT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange, 'rk.a');

    const matched = await mgr.matchQueues(exchange, 'rk.b');
    expect(matched).toEqual([]);
  });

  it('resolves a topic routing key to the union of matching patterns', async () => {
    // Two queues bound under two patterns. A key that matches both
    // patterns reaches both queues; the union deduplicates a queue
    // bound under multiple matching patterns.
    const { exchange } = await makeCreatedFixture(
      'mgr-match-topic',
      EExchangeType.TOPIC,
    );
    const [qA, qB] = await makeQueues('mgr-match-topic-q', 2);
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(qA, exchange, 'order.*');
    await mgr.bindQueue(qB, exchange, 'order.#');
    // Bind qA under a second matching pattern — the union must
    // deduplicate.
    await mgr.bindQueue(qA, exchange, '#.created');

    const matched = await mgr.matchQueues(exchange, 'order.created');
    expect(sortQueues(matched)).toEqual(sortQueues([qA, qB]));
  });

  it('returns every bound queue for a fanout exchange, ignoring the routing key', async () => {
    const { exchange } = await makeCreatedFixture(
      'mgr-match-fanout',
      EExchangeType.FANOUT,
    );
    const [qA, qB] = await makeQueues('mgr-match-fanout-q', 2);
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(qA, exchange);
    await mgr.bindQueue(qB, exchange);

    const matched = await mgr.matchQueues(exchange);
    expect(sortQueues(matched)).toEqual(sortQueues([qA, qB]));
  });

  it('rejects with InvalidFanoutExchangeParametersError when a fanout call supplies a routing key', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-match-fanout-arity',
      EExchangeType.FANOUT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange);

    await expect(mgr.matchQueues(exchange, 'rk.any')).rejects.toThrow(
      errors.InvalidFanoutExchangeParametersError,
    );
  });

  it('rejects with InvalidExchangeRoutingKeyError when a direct call omits the routing key', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-match-direct-arity',
      EExchangeType.DIRECT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange, 'rk.a');

    await expect(mgr.matchQueues(exchange)).rejects.toThrow(
      errors.InvalidExchangeRoutingKeyError,
    );
  });

  it('rejects with InvalidExchangeRoutingKeyError when a topic call omits the routing key', async () => {
    const { queue, exchange } = await makeCreatedFixture(
      'mgr-match-topic-arity',
      EExchangeType.TOPIC,
    );
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(queue, exchange, 'order.*');

    await expect(mgr.matchQueues(exchange)).rejects.toThrow(
      errors.InvalidExchangeRoutingKeyError,
    );
  });

  it('rejects with ExchangeNotFoundError on a missing exchange', async () => {
    const { exchange } = await makeFixture('mgr-match-missing-ex');
    const mgr = RedisSMQ.createExchangeManager();

    await expect(mgr.matchQueues(exchange, 'rk.a')).rejects.toThrow(
      errors.ExchangeNotFoundError,
    );
  });
});

// ---------------------------------------------------------------------------
// getBindings
// ---------------------------------------------------------------------------

describe('ExchangeManager — getBindings', () => {
  it('returns a routing-key to queues map for a direct exchange', async () => {
    const { exchange } = await makeCreatedFixture(
      'mgr-bindings-direct',
      EExchangeType.DIRECT,
    );
    const [qA, qB] = await makeQueues('mgr-bindings-direct-q', 2);
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(qA, exchange, 'rk.a');
    await mgr.bindQueue(qB, exchange, 'rk.b');

    const bindings = await mgr.getBindings(exchange);
    expect(bindings).toEqual({
      'rk.a': [qA],
      'rk.b': [qB],
    });
  });

  it('returns a pattern to queues map for a topic exchange', async () => {
    const { exchange } = await makeCreatedFixture(
      'mgr-bindings-topic',
      EExchangeType.TOPIC,
    );
    const [qA, qB] = await makeQueues('mgr-bindings-topic-q', 2);
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(qA, exchange, 'order.*');
    await mgr.bindQueue(qB, exchange, 'payment.#');

    const bindings = await mgr.getBindings(exchange);
    expect(bindings).toEqual({
      'order.*': [qA],
      'payment.#': [qB],
    });
  });

  it('returns a flat list of bound queues for a fanout exchange', async () => {
    const { exchange } = await makeCreatedFixture(
      'mgr-bindings-fanout',
      EExchangeType.FANOUT,
    );
    const [qA, qB] = await makeQueues('mgr-bindings-fanout-q', 2);
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(qA, exchange);
    await mgr.bindQueue(qB, exchange);

    const bindings = await mgr.getBindings(exchange);
    expect(Array.isArray(bindings)).toBe(true);
    expect(sortQueues(bindings as IQueueParams[])).toEqual(
      sortQueues([qA, qB]),
    );
  });

  it('rejects with ExchangeNotFoundError on a missing exchange', async () => {
    const { exchange } = await makeFixture('mgr-bindings-missing');
    const mgr = RedisSMQ.createExchangeManager();

    await expect(mgr.getBindings(exchange)).rejects.toThrow(
      errors.ExchangeNotFoundError,
    );
  });
});

// ---------------------------------------------------------------------------
// getBindingQueues
// ---------------------------------------------------------------------------

describe('ExchangeManager — getBindingQueues', () => {
  it('returns the queues under a specific routing key for a direct exchange', async () => {
    const { exchange } = await makeCreatedFixture(
      'mgr-bq-direct',
      EExchangeType.DIRECT,
    );
    const [qA, qB] = await makeQueues('mgr-bq-direct-q', 2);
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(qA, exchange, 'rk.a');
    await mgr.bindQueue(qB, exchange, 'rk.b');

    expect(await mgr.getBindingQueues(exchange, 'rk.a')).toEqual([qA]);
    expect(await mgr.getBindingQueues(exchange, 'rk.b')).toEqual([qB]);
  });

  it('returns the queues under a specific pattern for a topic exchange', async () => {
    const { exchange } = await makeCreatedFixture(
      'mgr-bq-topic',
      EExchangeType.TOPIC,
    );
    const [qA] = await makeQueues('mgr-bq-topic-q', 1);
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(qA, exchange, 'order.#');

    expect(await mgr.getBindingQueues(exchange, 'order.#')).toEqual([qA]);
  });

  it('returns every bound queue for a fanout exchange, ignoring the omitted binding', async () => {
    const { exchange } = await makeCreatedFixture(
      'mgr-bq-fanout',
      EExchangeType.FANOUT,
    );
    const [qA, qB] = await makeQueues('mgr-bq-fanout-q', 2);
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.bindQueue(qA, exchange);
    await mgr.bindQueue(qB, exchange);

    expect(sortQueues(await mgr.getBindingQueues(exchange))).toEqual(
      sortQueues([qA, qB]),
    );
  });

  it('returns an empty array for a missing exchange without rejecting', async () => {
    // Unlike `matchQueues`, `getBindingQueues` treats a missing
    // exchange as "no bindings" — an empty result, not an error. The
    // behavior matches the source's direct and topic bound-queue
    // readers, which return an empty set for a missing key.
    const { exchange } = await makeFixture('mgr-bq-missing');
    const mgr = RedisSMQ.createExchangeManager();

    expect(await mgr.getBindingQueues(exchange, 'rk.any')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Type-specific reads
// ---------------------------------------------------------------------------

describe('ExchangeManager — type-specific reads', () => {
  describe('getRoutingKeys', () => {
    it('returns the routing keys for a direct exchange', async () => {
      const { exchange } = await makeCreatedFixture(
        'mgr-rk-direct',
        EExchangeType.DIRECT,
      );
      const [qA] = await makeQueues('mgr-rk-direct-q', 1);
      const mgr = RedisSMQ.createExchangeManager();

      await mgr.bindQueue(qA, exchange, 'rk.a');
      await mgr.bindQueue(qA, exchange, 'rk.b');

      const keys = await mgr.getRoutingKeys(exchange);
      expect([...keys].sort()).toEqual(['rk.a', 'rk.b']);
    });

    it('rejects with ExchangeTypeMismatchError on a non-direct exchange', async () => {
      const { queue, exchange } = await makeCreatedFixture(
        'mgr-rk-mismatch',
        EExchangeType.TOPIC,
      );
      const mgr = RedisSMQ.createExchangeManager();

      await mgr.bindQueue(queue, exchange, 'order.*');

      await expect(mgr.getRoutingKeys(exchange)).rejects.toThrow(
        errors.ExchangeTypeMismatchError,
      );
    });
  });

  describe('getRoutingPatterns', () => {
    it('returns the patterns for a topic exchange', async () => {
      const { exchange } = await makeCreatedFixture(
        'mgr-rp-topic',
        EExchangeType.TOPIC,
      );
      const [qA] = await makeQueues('mgr-rp-topic-q', 1);
      const mgr = RedisSMQ.createExchangeManager();

      await mgr.bindQueue(qA, exchange, 'order.*');
      await mgr.bindQueue(qA, exchange, 'payment.#');

      const patterns = await mgr.getRoutingPatterns(exchange);
      expect([...patterns].sort()).toEqual(['order.*', 'payment.#']);
    });

    it('rejects with ExchangeTypeMismatchError on a non-topic exchange', async () => {
      const { queue, exchange } = await makeCreatedFixture(
        'mgr-rp-mismatch',
        EExchangeType.DIRECT,
      );
      const mgr = RedisSMQ.createExchangeManager();

      await mgr.bindQueue(queue, exchange, 'rk.a');

      await expect(mgr.getRoutingPatterns(exchange)).rejects.toThrow(
        errors.ExchangeTypeMismatchError,
      );
    });
  });

  describe('getBoundQueues', () => {
    it('returns the queues for a fanout exchange', async () => {
      const { exchange } = await makeCreatedFixture(
        'mgr-bq-fanout-read',
        EExchangeType.FANOUT,
      );
      const [qA, qB] = await makeQueues('mgr-bq-fanout-read-q', 2);
      const mgr = RedisSMQ.createExchangeManager();

      await mgr.bindQueue(qA, exchange);
      await mgr.bindQueue(qB, exchange);

      const queues = await mgr.getBoundQueues(exchange);
      expect(sortQueues(queues)).toEqual(sortQueues([qA, qB]));
    });

    it('rejects with ExchangeTypeMismatchError on a non-fanout exchange', async () => {
      const { queue, exchange } = await makeCreatedFixture(
        'mgr-bq-fanout-mismatch',
        EExchangeType.DIRECT,
      );
      const mgr = RedisSMQ.createExchangeManager();

      await mgr.bindQueue(queue, exchange, 'rk.a');

      await expect(mgr.getBoundQueues(exchange)).rejects.toThrow(
        errors.ExchangeTypeMismatchError,
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

describe('ExchangeManager — discovery', () => {
  it('lists every exchange across namespaces', async () => {
    // The per-test flush ensures `getAllExchanges` sees only what
    // this test created. Three exchanges of three different types.
    const { exchange: e1 } = await makeCreatedFixture(
      'mgr-list-all-a',
      EExchangeType.DIRECT,
    );
    const { exchange: e2 } = await makeCreatedFixture(
      'mgr-list-all-b',
      EExchangeType.TOPIC,
    );
    const { exchange: e3 } = await makeCreatedFixture(
      'mgr-list-all-c',
      EExchangeType.FANOUT,
    );
    const mgr = RedisSMQ.createExchangeManager();

    const all = await mgr.getAllExchanges();
    const names = new Set(all.map((e: IExchangeParsedParams) => e.name));
    expect(names).toContain(e1.name);
    expect(names).toContain(e2.name);
    expect(names).toContain(e3.name);
  });

  it('lists only the exchanges in the queried namespace', async () => {
    const nsA = `mgr-list-ns-a-${Date.now()}`;
    const nsB = `mgr-list-ns-b-${Date.now()}`;

    const qA = uniqueQueue('mgr-list-qA');
    qA.ns = nsA;
    await createQueue(qA, EQueueType.FIFO_QUEUE);

    const qB = uniqueQueue('mgr-list-qB');
    qB.ns = nsB;
    await createQueue(qB, EQueueType.FIFO_QUEUE);

    const exA = { ns: nsA, name: 'shared-name' };
    const exB = { ns: nsB, name: 'shared-name' };

    const mgr = RedisSMQ.createExchangeManager();
    await mgr.create(exA, EExchangeType.DIRECT, EExchangeQueuePolicy.STANDARD);
    await mgr.create(exB, EExchangeType.DIRECT, EExchangeQueuePolicy.STANDARD);

    const listA = await mgr.getNamespaceExchanges(nsA);
    const listB = await mgr.getNamespaceExchanges(nsB);

    expect(listA.map((e) => e.ns)).toEqual([nsA]);
    expect(listB.map((e) => e.ns)).toEqual([nsB]);
    expect(listA[0].name).toBe('shared-name');
    expect(listB[0].name).toBe('shared-name');
  });

  it('lists the exchanges a queue is bound to', async () => {
    const { queue, exchange: e1 } = await makeCreatedFixture(
      'mgr-queue-ex',
      EExchangeType.DIRECT,
    );
    const e2 = { ns: queue.ns, name: `ex-b-${Date.now()}` };
    const mgr = RedisSMQ.createExchangeManager();

    await mgr.create(e2, EExchangeType.TOPIC, EExchangeQueuePolicy.STANDARD);
    await mgr.bindQueue(queue, e1, 'rk.a');
    await mgr.bindQueue(queue, e2, 'order.*');

    const bound = await mgr.getQueueExchanges(queue);
    const names = new Set(bound.map((e) => e.name));
    expect(names).toEqual(new Set([e1.name, e2.name]));
  });
});
