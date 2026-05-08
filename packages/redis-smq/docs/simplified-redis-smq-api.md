# Simplified RedisSMQ API

The `RedisSMQ` class provides a simplified API: initialize once, create components via factory methods, and shut down everything with a single call. Components created this way are automatically tracked and cleaned up.

## Overview

```javascript
const { RedisSMQ } = require('redis-smq');

// 1. Initialize once
RedisSMQ.initialize(redisConfig, callback);

// 2. Create components via factory methods
const producer = RedisSMQ.createProducer();
const consumer = RedisSMQ.createConsumer();

// 3. Single shutdown for everything
RedisSMQ.shutdown(callback);
```

## Initialization

Call once when your application starts:

```javascript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (err) => {
    if (err) console.error('Failed:', err);
  },
);
```

## Factory Methods

All components can be created through the `RedisSMQ` class:

### Producers

```javascript
// Create
const producer = RedisSMQ.createProducer();

// Create and start
const producer = RedisSMQ.startProducer((err) => {
  if (err) console.error('Start failed:', err);
});
```

### Consumers

```javascript
// Create
const consumer = RedisSMQ.createConsumer();

// Create multiplexed consumer (shared connection)
const consumer = RedisSMQ.createConsumer(true);

// Create and start
const consumer = RedisSMQ.startConsumer((err) => {
  if (err) console.error('Start failed:', err);
});
```

### Queue Management

```javascript
const queueManager = RedisSMQ.createQueueManager();
const stateManager = RedisSMQ.createQueueStateManager();
const rateLimitManager = RedisSMQ.createQueueRateLimit();
const consumerGroups = RedisSMQ.createConsumerGroups();
```

### Messages

```javascript
const messageManager = RedisSMQ.createMessageManager();

// Message browsing
const publishedMessages = RedisSMQ.createQueuePublishedMessages();
const pendingMessages = RedisSMQ.createQueuePendingMessages();
const scheduledMessages = RedisSMQ.createQueueScheduledMessages();
const acknowledgedMessages = RedisSMQ.createQueueAcknowledgedMessages();
const deadLetteredMessages = RedisSMQ.createQueueDeadLetteredMessages();
```

### Exchanges

```javascript
const directExchange = RedisSMQ.createDirectExchange();
const topicExchange = RedisSMQ.createTopicExchange();
const fanoutExchange = RedisSMQ.createFanoutExchange();
```

### Configuration

```javascript
const configManager = RedisSMQ.createConfigManager();
```

## Automatic Cleanup

Components created via factory methods are tracked by `RedisSMQ`. Calling `RedisSMQ.shutdown()` automatically shuts them all down:

```javascript
// Create components
const producer = RedisSMQ.createProducer();
const consumer = RedisSMQ.createConsumer();
const queueManager = RedisSMQ.createQueueManager();

// ... use them ...

// One call shuts down everything
RedisSMQ.shutdown((err) => {
  if (err) console.error('Shutdown error:', err);
  else console.log('All components stopped');
});
```

## Individual Shutdown

You can still shut down components individually if needed:

```javascript
// Stop a specific consumer early
consumer.shutdown((err) => {
  if (err) console.error('Consumer shutdown failed:', err);
});

// Other components keep running
```

Components shut down individually are removed from tracking. They will not be shut down again by `RedisSMQ.shutdown()`.

## Start Methods

`startProducer()` and `startConsumer()` create and start in one call:

```javascript
// Create and start
const producer = RedisSMQ.startProducer((err) => {
  if (err) return console.error(err);
  console.log('Producer ready, ID:', producer.getId());
});

// Equivalent to:
const producer = RedisSMQ.createProducer();
producer.run((err) => {
  if (err) return console.error(err);
  console.log('Producer ready');
});
```

## Complete Example

```javascript
const { RedisSMQ, ProducibleMessage } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

// Initialize
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (err) => {
    if (err) throw err;

    // Create and start a producer
    const producer = RedisSMQ.startProducer((err) => {
      if (err) throw err;

      // Send a message
      const msg = new ProducibleMessage()
        .setQueue('orders')
        .setBody({ hello: 'world' });

      producer.produce(msg, (err, ids) => {
        if (err) console.error('Send failed:', err);
        else console.log('Sent:', ids[0]);
      });
    });

    // Create and start a consumer
    const consumer = RedisSMQ.startConsumer((err) => {
      if (err) throw err;

      consumer.consume('orders', (msg, done) => {
        console.log('Received:', msg.body);
        done();
      });
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      RedisSMQ.shutdown((err) => {
        process.exit(err ? 1 : 0);
      });
    });
  },
);
```

## Best Practices

- **Initialize once** at application startup
- **Use factory methods** so components are tracked for cleanup
- **Use a single `RedisSMQ.shutdown()`** at application exit
- **Handle shutdown signals** (SIGINT, SIGTERM) for clean exit
- **Avoid mixing** tracked and untracked components — if you create a component directly (not via factory), shut it down yourself
