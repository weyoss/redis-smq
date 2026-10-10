[RedisSMQ](../README.md) / [Documentation](README.md) / Quick Start

# Quick Start

Get RedisSMQ running in your Node.js application in minutes.

## 1. Install

```bash
npm install redis-smq redis-smq-common ioredis
```

`redis-smq-common` is a required peer dependency and must be installed alongside `redis-smq` at the same version. `ioredis` is the Redis client used in the examples below; `@redis/client` works too — see [Installation](installation.md).

Requires **Node.js 22+**.

## 2. Initialize

Initialize once, before creating any component:

```javascript
const { RedisSMQ } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (err) => {
    if (err) return console.error('Initialization failed:', err);
    console.log('RedisSMQ ready');
  },
);
```

Calling a factory method (`createProducer()`, `createConsumer()`, and the rest) before `initialize()` completes throws `PanicError`. In the example above, everything else happens inside the initialization callback so the ordering is guaranteed.

## 3. Create a Queue

Queues are not created automatically. Create the queue before producing to it:

```javascript
const { RedisSMQ, EQueueType, EQueueDeliveryModel } = require('redis-smq');

const queueManager = RedisSMQ.createQueueManager();

queueManager.save(
  'orders',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err) => {
    if (err) return console.error('Queue creation failed:', err);
    console.log('Queue created');
  },
);
```

## 4. Produce a Message

```javascript
const producer = RedisSMQ.createProducer();

producer.run((err) => {
  if (err) return console.error('Producer failed:', err);

  const msg = RedisSMQ.newProducibleMessage()
    .setQueue('orders')
    .setBody({ orderId: 123 });

  producer.produce(msg, (err, ids) => {
    if (err) return console.error('Send failed:', err);
    console.log('Message sent:', ids[0]);
  });
});
```

`produce` resolves with an array of message IDs. For a direct-to-queue send, the array contains exactly one ID.

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
      if (err) console.error('Consume registration failed:', err);
    },
  );
});
```

A handler can also be a promise-style function:

```javascript
await consumer.consume('orders', async (msg) => {
  console.log('Received:', msg.body);
  // Returning successfully acknowledges the message.
});
```

## 6. Shutdown

Register a signal handler for clean shutdown:

```javascript
let shuttingDown = false;

process.on('SIGINT', () => {
  if (shuttingDown) return;
  shuttingDown = true;

  RedisSMQ.shutdown((err) => {
    if (err) console.error('Shutdown error:', err);
    else console.log('Clean exit');
    process.exit(err ? 1 : 0);
  });
});
```

`RedisSMQ.shutdown()` stops every component created through the `RedisSMQ` factory methods, plus the background workers, event buses, and connection pool. Components created directly (not via the factory) must be shut down individually.

## Complete Example

An end-to-end script using callbacks:

```javascript
const { RedisSMQ, EQueueType, EQueueDeliveryModel } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

// Shared error guard. Every step ends with `if (err) return fail(err);`
// so a failure short-circuits without wrapping every stage in a
// conditional. `process.exit` is safe here because this is a
// one-shot script, not a library.
function fail(err) {
  console.error('Fatal:', err);
  process.exit(1);
}

function produceAndConsume(producer) {
  const consumer = RedisSMQ.createConsumer();

  consumer.run((err) => {
    if (err) return fail(err);

    consumer.consume(
      'orders',
      (msg, done) => {
        console.log('Received:', msg.body);
        done();
      },
      (err) => {
        if (err) return fail(err);

        const msg = RedisSMQ.newProducibleMessage()
          .setQueue('orders')
          .setBody({ hello: 'world' });

        producer.produce(msg, (err, ids) => {
          if (err) return fail(err);
          console.log('Sent:', ids[0]);

          // One-shot script: shut down once the round trip completes.
          RedisSMQ.shutdown((shutdownErr) => {
            process.exit(shutdownErr ? 1 : 0);
          });
        });
      },
    );
  });
}

function startProducer() {
  const producer = RedisSMQ.createProducer();
  producer.run((err) => {
    if (err) return fail(err);
    produceAndConsume(producer);
  });
}

function createQueue() {
  const queueManager = RedisSMQ.createQueueManager();
  queueManager.save(
    'orders',
    EQueueType.FIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
    (err) => {
      if (err) return fail(err);
      startProducer();
    },
  );
}

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (err) => {
    if (err) return fail(err);
    createQueue();
  },
);

process.on('SIGINT', () => {
  RedisSMQ.shutdown((err) => process.exit(err ? 1 : 0));
});
```

## Using Promises

The same flow with `async/await`:

```javascript
const { RedisSMQ, EQueueType, EQueueDeliveryModel } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

async function main() {
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

  const consumer = RedisSMQ.createConsumer();
  await consumer.run();

  await consumer.consume('orders', async (msg) => {
    console.log('Received:', msg.body);
  });

  const msg = RedisSMQ.newProducibleMessage()
    .setQueue('orders')
    .setBody({ hello: 'world' });

  const ids = await producer.produce(msg);
  console.log('Sent:', ids);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await RedisSMQ.shutdown();
  process.exit(0);
});
```

## Next Steps

- [Configuration](configuration.md) — Namespace, logging, and message audit settings
- [Producing Messages](producing-messages.md) — Routing keys, exchanges, scheduling, retries
- [Consuming Messages](consuming-messages.md) — Handler styles, batch acks, multiplexing
- [Simplified API](simplified-redis-smq-api.md) — The full set of factory methods
- [Graceful Shutdown](graceful-shutdown.md) — What happens to in-flight messages during shutdown
