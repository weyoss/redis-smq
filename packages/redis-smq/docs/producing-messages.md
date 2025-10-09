[RedisSMQ](../README.md) / [Docs](README.md) / Producing Messages

# Producing Messages

The Producer publishes messages to a target queue or via exchanges (direct, topic, fanout). A single Producer instance 
can efficiently send messages—including priority or scheduled ones—to one or multiple queues.

Important
- Initialize RedisSMQ once per process before creating a Producer.
- When components are created through RedisSMQ factory methods, you typically do not need to shut them down 
individually; prefer RedisSMQ.shutdown(cb) to close shared infrastructure and tracked components.

See also:
- Initialization: [configuration.md](configuration.md)
- Exchanges overview: [message-exchanges.md](message-exchanges.md)
- API: [api/classes/Producer.md](api/classes/Producer.md) and [api/classes/ProducibleMessage.md](api/classes/ProducibleMessage.md)

## Targeting a queue or an exchange

Before producing, you must set exactly one target on the message:
- Queue
  - ProducibleMessage.setQueue('queue-name')
- Direct exchange (requires routing key)
  - ProducibleMessage.setDirectExchange('exchange-name')
  - ProducibleMessage.setExchangeRoutingKey('routing.key')
- Topic exchange (requires routing key/pattern)
  - ProducibleMessage.setTopicExchange('exchange-name')
  - ProducibleMessage.setExchangeRoutingKey('user.created' | 'user.*' | 'user.#' ...)
- Fanout exchange (no routing key)
  - ProducibleMessage.setFanoutExchange('exchange-name')

If you don’t set a queue or an exchange, producing will fail.

## Quick start: produce to a queue

```javascript
'use strict';

const { RedisSMQ, ProducibleMessage } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

// 1) Initialize once
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS, // or ERedisConfigClient.REDIS
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
  (err) => {
    if (err) {
      console.error('Failed to initialize RedisSMQ:', err);
      return;
    }

    // 2) Create and start a producer
    const producer = RedisSMQ.createProducer();
    producer.run((startErr) => {
      if (startErr) {
        console.error('Error starting producer:', startErr);
        return;
      }

      // 3) Build a message targeting a queue
      const msg = new ProducibleMessage()
        .setBody({ hello: 'world' })  // payload
        .setTTL(3600000)              // TTL in ms (optional)
        .setQueue('test_queue');      // target a queue

      producer.produce(msg, (produceErr, messageIds) => {
        if (produceErr) {
          console.error('Error producing message:', produceErr);
        } else {
          console.log('Produced message IDs:', messageIds);
        }

        // 4) Preferred shutdown: close everything at app exit with RedisSMQ.shutdown(...)
        // RedisSMQ.shutdown((e) => e && console.error('Shutdown error:', e));
      });
    });
  },
);
```

## Produce via a topic exchange

```javascript
'use strict';

const { RedisSMQ, ProducibleMessage } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (err) => {
    if (err) throw err;

    const producer = RedisSMQ.createProducer();
    producer.run((runErr) => {
      if (runErr) throw runErr;

      // Publish to a topic exchange; consumers bind queues using wildcard patterns
      const msg = new ProducibleMessage()
        .setTopicExchange('events')
        .setExchangeRoutingKey('user.created')
        .setBody({ userId: 123, ts: Date.now() });

      producer.produce(msg, (e, ids) => {
        if (e) return console.error('Produce failed:', e);
        console.log(`Delivered to ${ids.length} queue(s):`, ids);
      });
    });
  },
);
```

## Produce via a direct exchange

```javascript
'use strict';

const { RedisSMQ, ProducibleMessage } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (err) => {
    if (err) throw err;

    const producer = RedisSMQ.createProducer();
    producer.run((runErr) => {
      if (runErr) throw runErr;

      const msg = new ProducibleMessage()
        .setDirectExchange('orders')
        .setExchangeRoutingKey('order.created') // exact match required by bound queues
        .setBody({ orderId: 'ORD-001' });

      producer.produce(msg, (e, ids) => {
        if (e) return console.error('Produce failed:', e);
        console.log('Produced to queues:', ids);
      });
    });
  },
);
```

## Produce via a fanout exchange

```javascript
'use strict';

const { RedisSMQ, ProducibleMessage } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (err) => {
    if (err) throw err;

    const producer = RedisSMQ.createProducer();
    producer.run((runErr) => {
      if (runErr) throw runErr;

      // Fanout ignores routing keys; message goes to all bound queues
      const msg = new ProducibleMessage()
        .setFanoutExchange('notifications')
        .setBody({ message: 'System maintenance in 10 minutes' });

      producer.produce(msg, (e, ids) => {
        if (e) return console.error('Produce failed:', e);
        console.log('Broadcast to queues:', ids);
      });
    });
  },
);
```

## Tips

- Priority: Set with `ProducibleMessage.setPriority(...)` when producing to a priority queue.
- Retries: Configure retry behavior with `setRetryThreshold(...)` and `setRetryDelay(...)`.
- Scheduling: Use `setScheduledDelay(...)`, `setScheduledCRON(...)`, and `setScheduledRepeat(...)` for delayed/recurring 
delivery.
- Timeout: Use `setConsumeTimeout(...)` to fail a message if the consumer exceeds the processing window.

## Further Reading

- Message Exchanges: [message-exchanges.md](message-exchanges.md)
- Producer API: [api/classes/Producer.md](api/classes/Producer.md)
- ProducibleMessage API: [api/classes/ProducibleMessage.md](api/classes/ProducibleMessage.md)
