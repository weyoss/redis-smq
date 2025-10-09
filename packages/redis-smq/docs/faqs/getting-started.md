[RedisSMQ](../README.md) / [Docs](README.md) / [FAQs](README.md) / What is the recommended way to set up and configure RedisSMQ for a new project?

# What is the recommended way to set up and configure RedisSMQ for a new project?

## 1) Prerequisites

- Redis: Redis 7.x (or compatible) running locally or accessible remotely
- Node.js: v20+
- One Redis client library installed: ioredis or @redis/client

## 2) Install packages

Install RedisSMQ and shared utilities:

```bash
npm install redis-smq redis-smq-common --save
```

Install a Redis client (choose one):

```bash
# Option A: ioredis (recommended)
npm install ioredis --save

# Option B: @redis/client
npm install @redis/client --save
```

## 3) Initialize RedisSMQ once per process (required)

With the RedisSMQ class, you must initialize once at startup before creating producers, consumers, or managers.

Create a bootstrap file (for example, init.js):

```javascript
// init.js
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

// Required: initialize once per process
export function initRedisSMQ(cb) {
  RedisSMQ.initialize(
    {
      client: ERedisConfigClient.IOREDIS, // or ERedisConfigClient.REDIS
      options: { host: '127.0.0.1', port: 6379, db: 0 },
    },
    cb,
  );
}
```

Notes
- Use `RedisSMQ.initialize(...)` for simple setups (recommended).
- For persisted, shared configuration across processes, use `RedisSMQ.initializeWithConfig(...)` instead.

## 4) Create a queue

Use the QueueManager to create queues. Direct Queue Publishing (no exchange) is the fastest routing path.

Create queue.js:

```javascript
// queue.js
import { RedisSMQ, EQueueType, EQueueDeliveryModel } from 'redis-smq';
import { initRedisSMQ } from './init.js';

initRedisSMQ((err) => {
  if (err) return console.error('Init failed:', err);

  const qm = RedisSMQ.createQueueManager();
  qm.save(
    'my_queue',
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
    (saveErr, reply) => {
      if (saveErr) return console.error('Queue creation failed:', saveErr);
      console.log('Queue created:', reply);

      // When components are created via RedisSMQ, you typically do not need
      // to shut them down individually; prefer a single RedisSMQ.shutdown(cb)
      // at application exit to close shared infrastructure.
      RedisSMQ.shutdown((e) => e && console.error('Shutdown warning:', e));
    },
  );
});
```

## 5) Create a producer

Producers publish messages to a target queue or an exchange. For best performance, publish directly to a queue.

Create producer.js:

```javascript
// producer.js
import { RedisSMQ, ProducibleMessage } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';
import { initRedisSMQ } from './init.js';

initRedisSMQ((err) => {
  if (err) return console.error('Init failed:', err);

  // Create and start a producer
  const producer = RedisSMQ.createProducer();
  producer.run((runErr) => {
    if (runErr) return console.error('Producer start failed:', runErr);

    // Direct queue publishing (fastest path)
    const message = new ProducibleMessage()
      .setQueue('my_queue')
      .setBody({ hello: 'world' });

    producer.produce(message, (produceErr, messageIds) => {
      if (produceErr) return console.error('Produce failed:', produceErr);
      console.log(`Produced message IDs: ${messageIds.join(', ')}`);

      // Prefer a single RedisSMQ.shutdown at app exit
      RedisSMQ.shutdown((e) => e && console.error('Shutdown warning:', e));
    });
  });
});
```

## 6) Create a consumer

Consumers register handlers for queues (and optionally consumer groups for Pub/Sub queues) and then run.

Create consumer.js:

```javascript
// consumer.js
import { RedisSMQ } from 'redis-smq';
import { initRedisSMQ } from './init.js';

initRedisSMQ((err) => {
  if (err) return console.error('Init failed:', err);

  const consumer = RedisSMQ.createConsumer();

  const messageHandler = (msg, done) => {
    console.log('Received:', msg.body);
    done(); // Acknowledge success
  };

  consumer.consume('my_queue', messageHandler, (consumeErr) => {
    if (consumeErr) return console.error('consume() failed:', consumeErr);
    console.log('Handler registered for my_queue');

    consumer.run((runErr) => {
      if (runErr) return console.error('Consumer start failed:', runErr);
      console.log('Consumer is running');

      // In a real app, shutdown on process exit signals.
      // For demo, shutdown immediately:
      setTimeout(() => {
        RedisSMQ.shutdown((e) => e && console.error('Shutdown warning:', e));
      }, 1000);
    });
  });
});
```

## 7) Run the examples

Use separate terminals:

```bash
node queue.js
node producer.js
node consumer.js
```

You should see:
- The queue created
- The producer publishes a message to my_queue
- The consumer receives and acknowledges it

## Optional: Initialize with a full RedisSMQ configuration

If you need to persist configuration in Redis and share it across processes:

```javascript
// init-with-config.js
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient, EConsoleLoggerLevel } from 'redis-smq-common';

export function initWithConfig(cb) {
  RedisSMQ.initializeWithConfig(
    {
      namespace: 'my_project',
      redis: {
        client: ERedisConfigClient.IOREDIS,
        options: { host: '127.0.0.1', port: 6379, db: 0 },
      },
      logger: { enabled: true, options: { logLevel: EConsoleLoggerLevel.INFO } },
      messages: { store: false },
      eventBus: { enabled: false },
    },
    cb,
  );
}
```

_Notes_
- Direct use of the Configuration class is optional; `RedisSMQ.initialize` handles bootstrapping internally.
- If components were created via RedisSMQ factory methods, you typically do not need to call shutdown on each instance. 
Prefer a single `RedisSMQ.shutdown(cb)` at application exit.

## Next steps

- Producing and consuming
   - [Producing messages](../producing-messages.md)
   - [Consuming messages](../consuming-messages.md)
- Queues and delivery
   - [Queues](../queues.md)
   - [Delivery models (Point-to-Point, Pub/Sub)](../queue-delivery-models.md)
- Routing
   - [Message exchanges (direct, topic, fanout)](../message-exchanges.md)
   - [Exchanges vs direct publishing](../exchanges-and-delivery-models.md)
- Performance and operations
   - [Performance tips (direct queue publishing is fastest)](../performance.md)
   - [Graceful shutdown with RedisSMQ.shutdown](../graceful-shutdown.md)
