import bluebird from 'bluebird';
import { beforeEach, describe, expect, it } from 'vitest';
import { NoMatchedQueuesForMessageExchangeError } from '../../../src/errors/index.js';
import {
  EQueueType,
  ExchangeDirect,
  ExchangeTopic,
  ExchangeFanout,
  IExchangeParams,
  IQueueParams,
  ProducibleMessage,
  RedisSMQ,
  Producer,
} from '../../../src/index.js';
import { consumeOnce } from '../../common/consume-once.js';
import { createQueue } from '../../common/message-producing-consuming.js';

describe('Producer publishing to exchanges (direct/topic/fanout)', () => {
  const ns = 'ns1';
  const exchangeDirectParams: IExchangeParams = { ns, name: 'ex_direct_pub' };
  const exchangeTopicParams: IExchangeParams = { ns, name: 'ex_topic_pub' };
  const exchangeFanoutParams: IExchangeParams = { ns, name: 'ex_fanout_pub' };

  const queueA: IQueueParams = { ns, name: 'queueA' };
  const queueB: IQueueParams = { ns, name: 'queueB' };
  const queueC: IQueueParams = { ns, name: 'queueC' };

  let directExchange: ReturnType<typeof bluebird.promisifyAll<ExchangeDirect>>;
  let topicExchange: ReturnType<typeof bluebird.promisifyAll<ExchangeTopic>>;
  let fanoutExchange: ReturnType<typeof bluebird.promisifyAll<ExchangeFanout>>;
  let producer: ReturnType<typeof bluebird.promisifyAll<Producer>>;

  async function publishViaDirect(
    exchange: IExchangeParams,
    routingKey: string,
    payload: unknown,
  ) {
    const msg = new ProducibleMessage();
    msg
      .setDirectExchange(exchange)
      .setExchangeRoutingKey(routingKey)
      .setBody(payload);
    await producer.produceAsync(msg);
  }

  async function publishViaTopic(
    exchange: IExchangeParams,
    routingKey: string,
    payload: unknown,
  ) {
    const msg = new ProducibleMessage();
    msg
      .setTopicExchange(exchange)
      .setExchangeRoutingKey(routingKey)
      .setBody(payload);
    await producer.produceAsync(msg);
  }

  async function publishViaFanout(exchange: IExchangeParams, payload: unknown) {
    const msg = new ProducibleMessage();
    msg.setFanoutExchange(exchange).setBody(payload);
    await producer.produceAsync(msg);
  }

  beforeEach(async () => {
    // Ensure queues exist
    await createQueue(queueA, EQueueType.FIFO_QUEUE);
    await createQueue(queueB, EQueueType.FIFO_QUEUE);
    await createQueue(queueC, EQueueType.FIFO_QUEUE);

    // Create exchanges
    directExchange = bluebird.promisifyAll(RedisSMQ.createDirectExchange());
    topicExchange = bluebird.promisifyAll(RedisSMQ.createTopicExchange());
    fanoutExchange = bluebird.promisifyAll(RedisSMQ.createFanoutExchange());

    // Producer
    producer = bluebird.promisifyAll(RedisSMQ.createProducer());
    await producer.runAsync();
  });

  describe('Direct exchange publishing', () => {
    const rkOrderCreated = 'order.created';
    const rkOrderCancelled = 'order.cancelled';

    it('delivers to queues bound with the exact routing key only', async () => {
      // Bind:
      // queueA -> order.created
      // queueB -> order.cancelled
      await directExchange.bindQueueAsync(
        queueA,
        exchangeDirectParams,
        rkOrderCreated,
      );
      await directExchange.bindQueueAsync(
        queueB,
        exchangeDirectParams,
        rkOrderCancelled,
      );

      // Publish "created"
      const payloadA = { id: 'A1', type: rkOrderCreated };
      await publishViaDirect(exchangeDirectParams, rkOrderCreated, payloadA);

      // queueA should get it, queueB should not
      const [mA1, mB1] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
      ]);
      expect(mA1).toBeTruthy();
      expect(mB1).toBeNull();

      // Publish "cancelled"
      const payloadB = { id: 'B1', type: rkOrderCancelled };
      await publishViaDirect(exchangeDirectParams, rkOrderCancelled, payloadB);

      const [mA2, mB2] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
      ]);
      expect(mA2).toBeNull();
      expect(mB2).toBeTruthy();
    });

    it('no deliveries when routing key has no bindings', async () => {
      await directExchange.bindQueueAsync(
        queueA,
        exchangeDirectParams,
        rkOrderCreated,
      );

      // Unknown routing key
      await expect(
        publishViaDirect(exchangeDirectParams, 'order.updated', {
          id: 'X',
        }),
      ).rejects.toThrow(NoMatchedQueuesForMessageExchangeError);
    });

    it('delivers to multiple queues bound to the same key', async () => {
      // Both queues bound to the same key
      await directExchange.bindQueueAsync(
        queueA,
        exchangeDirectParams,
        rkOrderCreated,
      );
      await directExchange.bindQueueAsync(
        queueB,
        exchangeDirectParams,
        rkOrderCreated,
      );

      await publishViaDirect(exchangeDirectParams, rkOrderCreated, {
        id: 'multi',
      });

      // Both queues should receive a copy
      const [a, b] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
      ]);
      expect(a).toBeTruthy();
      expect(b).toBeTruthy();
    });
  });

  describe('Topic exchange publishing', () => {
    it('wildcard pattern * matches a single token and # matches zero or more tokens', async () => {
      // Bind patterns:
      // queueA -> order.* (matches "order.created", not "order.vip.created")
      // queueB -> order.# (matches "order", "order.created", "order.vip.created", ...)
      await topicExchange.bindQueueAsync(
        queueA,
        exchangeTopicParams,
        'order.*',
      );
      await topicExchange.bindQueueAsync(
        queueB,
        exchangeTopicParams,
        'order.#',
      );

      // Publish: "order.created" -> both queues should receive
      await publishViaTopic(exchangeTopicParams, 'order.created', {
        case: 'one',
      });

      const [a1, b1] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
      ]);
      expect(a1).toBeTruthy();
      expect(b1).toBeTruthy();

      // Publish: "order.vip.created" -> only queueB (order.#) should receive
      await publishViaTopic(exchangeTopicParams, 'order.vip.created', {
        case: 'two',
      });

      const [a2, b2] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
      ]);
      expect(a2).toBeNull();
      expect(b2).toBeTruthy();

      // Publish: "order" -> only queueB should receive (order.# matches zero tokens)
      await publishViaTopic(exchangeTopicParams, 'order', {
        case: 'three',
      });

      const [a3, b3] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
      ]);
      expect(a3).toBeNull();
      expect(b3).toBeTruthy();
    });

    it('multiple patterns can duplicate-match but each queue receives only one copy', async () => {
      // queueA bound to multiple patterns that both match "user.created"
      await topicExchange.bindQueueAsync(queueA, exchangeTopicParams, 'user.#');
      await topicExchange.bindQueueAsync(queueA, exchangeTopicParams, 'user.*');
      await topicExchange.bindQueueAsync(
        queueB,
        exchangeTopicParams,
        'user.created',
      );

      await publishViaTopic(exchangeTopicParams, 'user.created', {
        event: 'dup',
      });

      // Both queues receive exactly one message
      const [a, b] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
      ]);
      expect(a).toBeTruthy();
      expect(b).toBeTruthy();

      // No extra messages lingering
      const [a2, b2] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
      ]);
      expect(a2).toBeNull();
      expect(b2).toBeNull();
    });

    it('non-matching routing keys do not deliver', async () => {
      await topicExchange.bindQueueAsync(
        queueA,
        exchangeTopicParams,
        'payment.*',
      );
      await expect(
        publishViaTopic(exchangeTopicParams, 'order.created', {
          nope: true,
        }),
      ).rejects.toThrow(NoMatchedQueuesForMessageExchangeError);
    });
  });

  describe('Fanout exchange publishing', () => {
    it('delivers to all bound queues regardless of routing key', async () => {
      // Bind three queues
      await fanoutExchange.bindQueueAsync(queueA, exchangeFanoutParams);
      await fanoutExchange.bindQueueAsync(queueB, exchangeFanoutParams);
      await fanoutExchange.bindQueueAsync(queueC, exchangeFanoutParams);

      // Publish (routing key ignored for fanout)
      await publishViaFanout(exchangeFanoutParams, { hello: 'fanout' });

      const [a, b, c] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
        consumeOnce(queueC),
      ]);

      expect(a).toBeTruthy();
      expect(b).toBeTruthy();
      expect(c).toBeTruthy();
    });

    it('delivers to no queues when none are bound', async () => {
      // Publish to fanout with no bindings
      await expect(
        publishViaFanout(exchangeFanoutParams, { hello: 'nobody' }),
      ).rejects.toThrow(NoMatchedQueuesForMessageExchangeError);
    });
  });

  describe('Publishing isolation and namespaces', () => {
    it('does not leak deliveries across exchanges or namespaces', async () => {
      const otherNs = 'ns2';
      const directOtherNs: IExchangeParams = {
        ns: otherNs,
        name: 'ex_direct_other',
      };

      // Bind queueA to direct in ns1, queueB to direct in ns2 (namespaces isolated)
      await directExchange.bindQueueAsync(
        queueA,
        exchangeDirectParams,
        'ns.test',
      );

      const directExchangeOtherNs = bluebird.promisifyAll(
        RedisSMQ.createDirectExchange(),
      );
      await createQueue({ ns: otherNs, name: 'queueB' }, EQueueType.FIFO_QUEUE);
      await directExchangeOtherNs.bindQueueAsync(
        { ns: otherNs, name: 'queueB' },
        directOtherNs,
        'ns.test',
      );

      // Publish into ns1 exchange
      await publishViaDirect(exchangeDirectParams, 'ns.test', { check: 'ns' });

      // queueA in ns1 should receive, queueB in ns2 should not
      const [a, b] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce({ ns: otherNs, name: 'queueB' }),
      ]);

      expect(a).toBeTruthy();
      expect(b).toBeNull();
    });
  });
});
