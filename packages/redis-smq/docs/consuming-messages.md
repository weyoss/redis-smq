[RedisSMQ](../README.md) / [Docs](README.md) / Consuming Messages

# Consuming Messages

The [Consumer](api/classes/Consumer.md) receives and processes messages from one or more queues.

Prerequisites:
- Initialize RedisSMQ once per process before creating consumers:
  - `RedisSMQ.initialize(redisConfig, cb)`, or
  - `RedisSMQ.initializeWithConfig(redisSMQConfig, cb)`
- Prefer creating consumers via the RedisSMQ factory: `const consumer = RedisSMQ.createConsumer()`

## Message Handler

A message handler is a callback you define. It receives the delivered message and must acknowledge or fail it.

- You can register handlers before or after the consumer has started.
- Consumers do not auto-start; call [`Consumer.run()`](api/classes/Consumer.md#run) explicitly.

Acknowledgement:
- Call `done()` with no arguments to acknowledge success.
- Call `done(err)` to signal failure (the message will be retried based on your configuration).

## Registering a Message Handler (queue)

```javascript
'use strict';

const { RedisSMQ } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

// 1) Initialize once per process
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
  (initErr) => {
    if (initErr) return console.error('Init failed:', initErr);

    // 2) Create a consumer via RedisSMQ
    const consumer = RedisSMQ.createConsumer();

    // 3) Register a message handler
    const handler = (msg, done) => {
      console.log('Message payload:', msg.body);
      // ... your logic ...
      done(); // Acknowledge
    };

    consumer.consume('test_queue', handler, (consumeErr) => {
      if (consumeErr) return console.error('consume() failed:', consumeErr);
      console.log('Handler registered for test_queue');
    });

    // 4) Start the consumer
    consumer.run((runErr) => {
      if (runErr) return console.error('Consumer start failed:', runErr);
      console.log('Consumer is running');
    });
  },
);
```

## Registering After Starting

You can also register handlers after starting:

```javascript
'use strict';

const { RedisSMQ } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (initErr) => {
    if (initErr) return console.error('Init failed:', initErr);

    const consumer = RedisSMQ.createConsumer();

    consumer.run((runErr) => {
      if (runErr) return console.error('Consumer start failed:', runErr);

      const handler = (msg, done) => {
        console.log('Message payload:', msg.body);
        done();
      };

      consumer.consume('test_queue', handler, (consumeErr) => {
        if (consumeErr) return console.error('consume() failed:', consumeErr);
        console.log('Handler registered after start');
      });
    });
  },
);
```

## Pub/Sub Consumption (consumer groups)

For Pub/Sub queues, provide a consumer group ID. Each message is delivered to all groups; within a group, only one 
consumer receives it.

```javascript
'use strict';

const { RedisSMQ } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (initErr) => {
    if (initErr) return console.error('Init failed:', initErr);

    const consumer = RedisSMQ.createConsumer();

    const handler = (msg, done) => {
      // process...
      done();
    };

    consumer.consume(
      { queue: 'my_pubsub_queue', groupId: 'email-service' },
      handler,
      (consumeErr) => {
        if (consumeErr) return console.error('consume() failed:', consumeErr);
        console.log('Handler registered for Pub/Sub with group email-service');
      },
    );

    consumer.run((runErr) => {
      if (runErr) return console.error('Consumer start failed:', runErr);
      console.log('Consumer is running (Pub/Sub)');
    });
  },
);
```

## Stopping Consumption

- Cancel a specific queue handler: [`Consumer.cancel()`](api/classes/Consumer.md#cancel)
    - Removes the handler for that queue, the consumer keeps running for other queues.
- Shut down the consumer and remove all handlers: [`Consumer.shutdown()`](api/classes/Consumer.md#shutdown)
    - Useful if you need to stop an individual consumer early.
- When using RedisSMQ factory-created components, you typically do not need to call shutdown on each instance at 
application exit. Prefer a single `RedisSMQ.shutdown(cb)` to close shared infrastructure and tracked components.

Example cancel:

```javascript
consumer.cancel('test_queue', (err) => {
  if (err) console.error('Cancel failed:', err);
  else console.log('Stopped consuming test_queue');
});
```

## Message Acknowledgement and Retries

- Success: done()
- Failure: done(error)
- Retries: Unacknowledged messages are retried until reaching the configured retry threshold.
- DLQ: Messages that repeatedly fail can be dead-lettered if configured. See [Messages](messages.md) and [Configuration](configuration.md).

## Message Storage (optional)

By default, RedisSMQ does not store acknowledged or dead-lettered messages. You can enable storage in 
your [configuration](configuration.md) if needed for observability or auditing.

For more in-depth information, refer to the [Consumer Class](api/classes/Consumer.md) documentation.
