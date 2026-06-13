[RedisSMQ](../README.md) / [Documentation](README.md) / Quick Start

# Quick Start

Get RedisSMQ running in your Node.js application in minutes.

## 1. Install

```bash
npm install redis-smq@next redis-smq-common@next --save
npm install ioredis --save
```

## 2. Initialize

```javascript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (err) => {
    if (err) console.error('Initialization failed:', err);
    else console.log('RedisSMQ ready');
  },
);
```

## 3. Create a Queue

```javascript
import { EQueueType, EQueueDeliveryModel } from 'redis-smq';

const queueManager = RedisSMQ.createQueueManager();
queueManager.save(
  'orders',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err) => {
    if (err) console.error('Queue creation failed:', err);
    else console.log('Queue created');
  },
);
```

## 4. Produce a Message

```javascript
import { ProducibleMessage } from 'redis-smq';

const producer = RedisSMQ.createProducer();
producer.run((err) => {
  if (err) return console.error('Producer failed:', err);

  const msg = new ProducibleMessage()
    .setQueue('orders')
    .setBody({ orderId: 123 });

  producer.produce(msg, (err, ids) => {
    if (err) console.error('Send failed:', err);
    else console.log('Message sent:', ids[0]);
  });
});
```

## 5. Consume Messages

```javascript
const consumer = RedisSMQ.createConsumer();
consumer.run((err) => {
  if (err) return console.error('Consumer failed:', err);

  consumer.consume(
    'orders',
    (msg, done) => {
      console.log('Received:', msg.body);
      done(); // Acknowledge
    },
    (err) => {
      if (err) console.error('Consume failed:', err);
    },
  );
});
```

## 6. Shutdown

```javascript
process.on('SIGINT', () => {
  RedisSMQ.shutdown((err) => {
    if (err) console.error('Shutdown error:', err);
    else console.log('Clean exit');
    process.exit(0);
  });
});
```

## Using Promises

```javascript
import {
  RedisSMQ,
  ProducibleMessage,
  EQueueType,
  EQueueDeliveryModel,
} from 'redis-smq';

await RedisSMQ.initialize({
  client: ERedisConfigClient.IOREDIS,
  options: { host: '127.0.0.1', port: 6379 },
});

const queueManager = RedisSMQ.createQueueManager();
await queueManager.save(
  'orders',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
);

const producer = RedisSMQ.createProducer();
await producer.run();

const msg = new ProducibleMessage()
  .setQueue('orders')
  .setBody({ hello: 'world' });
const ids = await producer.produce(msg);
console.log('Sent:', ids);

const consumer = RedisSMQ.createConsumer();
await consumer.run();

await consumer.consume('orders', async (msg) => {
  console.log('Received:', msg.body);
});
```

## Next Steps

- [Simplified API](simplified-redis-smq-api.md) — Cleaner API with factory methods
- [Producing Messages](producing-messages.md) — All publish options
- [Consuming Messages](consuming-messages.md) — All consume options
