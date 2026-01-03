[RedisSMQ](../README.md) / [Docs](README.md) / Multiplexing

# Multiplexing

By default, each message handler uses its own Redis connection for consuming messages. This has important benefits:

- High message consumption rate: parallel dequeueing/processing per handler
- Isolation: one slow handler won’t block others

Multiplexing lets multiple message handlers share a single Redis connection within the same Consumer. While this reduces parallelism, it can significantly decrease the number of Redis connections your application uses.

## When to consider multiplexing

Use multiplexing if:

- You manage a large number of low-traffic queues
- You must minimize Redis connections (e.g., connection quotas in serverless/PaaS)
- You want to simplify resource planning for many queues per process

Avoid or limit multiplexing if:

- You need maximum throughput and parallel processing across queues
- You have “hot” queues where head-of-line blocking would be problematic
- Your handlers are CPU-bound or perform long-running work

## Advantages

- Resource efficiency: Share a single Redis connection across many queue handlers in one Consumer
- Scalability of queue count: Handle many queues with predictable, low connection usage

## Disadvantages

- Serial dequeue/processing: Handlers execute one after another; no parallel dequeue across queues in a multiplexed Consumer
- Potential head-of-line blocking: A slow handler can delay dequeueing for other queues handled by the same Consumer

## Prerequisites

- Initialize RedisSMQ once per process:
  - RedisSMQ.initialize(redisConfig, cb), or
  - RedisSMQ.initializeWithConfig(redisSMQConfig, cb)
- Prefer creating consumers via RedisSMQ factory methods (recommended)
- When components are created via RedisSMQ factory methods, you typically do not need to shut them down individually. Prefer a single RedisSMQ.shutdown(cb) at application exit to close shared infrastructure and tracked components.

## Enabling multiplexing

You can enable multiplexing on the Consumer by passing true as the first argument.

Recommended (via RedisSMQ factory):

```javascript
'use strict';

const { RedisSMQ } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

// Initialize once per process
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
  (err) => {
    if (err) return console.error('Init failed:', err);

    // Create a multiplexed consumer (single Redis connection for multiple handlers)
    const consumer = RedisSMQ.createConsumer(true);

    // Register handlers for multiple queues
    consumer.consume(
      'queue1',
      (msg, done) => {
        /* ... */ done();
      },
      (e) => e && console.error(e),
    );
    consumer.consume(
      'queue2',
      (msg, done) => {
        /* ... */ done();
      },
      (e) => e && console.error(e),
    );
    consumer.consume(
      'queue3',
      (msg, done) => {
        /* ... */ done();
      },
      (e) => e && console.error(e),
    );

    // Start the consumer
    consumer.run((runErr) => {
      if (runErr) return console.error('Consumer start failed:', runErr);
      console.log('Multiplexed consumer is running');
    });

    // At application exit, prefer a single call:
    // RedisSMQ.shutdown((e) => e && console.error('Shutdown error:', e));
  },
);
```

Direct instantiation (advanced):

```javascript
'use strict';

const { Consumer } = require('redis-smq');

const consumer = new Consumer(true); // enable multiplexing
consumer.consume(
  'queueA',
  (msg, done) => {
    /* ... */ done();
  },
  () => {},
);
consumer.run(() => {});
// If created directly, you can shut down this instance with consumer.shutdown(cb)
```

## Operational tips

- Keep handlers fast: Long-running handlers increase latency for other queues in the same multiplexed Consumer
- Isolate “hot” queues: Use a dedicated non-multiplexed Consumer, or separate multiplexed Consumers by traffic profile
- Scale out cautiously: If you need some parallelism, run multiple multiplexed Consumers, each handling a subset of queues
- Manage handlers dynamically:
  - Cancel a specific queue handler:
    ```javascript
    consumer.cancel('queue2', (err) => {
      if (err) console.error('Cancel failed:', err);
      else console.log('Stopped consuming queue2');
    });
    ```
  - Inspect configured queues:
    ```javascript
    const queues = consumer.getQueues();
    console.log('Multiplexed queues:', queues);
    ```

## Summary

- Multiplexing reduces Redis connections by sharing one connection across many handlers in a single Consumer.
- Throughput trades off against connection savings: processing is sequential within a multiplexed Consumer.
- Use multiplexing for many low-traffic queues or in environments with strict connection limits.
- For high-throughput or latency-sensitive queues, prefer non-multiplexed Consumers or split work across multiple Consumers.

For API details, see the Consumer class:

- [Consumer](api/classes/Consumer.md)
