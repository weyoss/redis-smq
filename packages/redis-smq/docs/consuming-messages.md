[RedisSMQ](../README.md) / [Documentation](README.md) / Consuming Messages

# Consuming Messages

A Consumer processes messages from queues. You provide a handler function that receives each message and must explicitly acknowledge or reject it.

## Quick Start

### 1. Create and Start a Consumer

```javascript
const { RedisSMQ } = require('redis-smq');

const consumer = RedisSMQ.createConsumer();

consumer.run((err) => {
  if (err) console.error('Failed to start consumer:', err);
  else console.log('Consumer running');
});
```

### 2. Consume a Queue

```javascript
consumer.consume(
  'orders',
  (message, done) => {
    console.log('Processing:', message.body);

    // Your business logic here

    done(); // Acknowledge success
    // done(new Error('Failed')); // Reject — triggers retry
  },
  (err) => {
    if (err) console.error('Consume failed:', err);
    else console.log('Listening on orders');
  },
);
```

### 3. Shutdown

```javascript
consumer.shutdown((err) => {
  if (err) console.error('Shutdown failed:', err);
});
```

## Message Handler

The handler receives two arguments:

- **`message`** — the message object with `body`, `id`, `ttl`, `priority`, and metadata
- **`done(err)`** — callback to acknowledge or reject

```javascript
consumer.consume(
  'orders',
  (message, done) => {
    try {
      // Process the message
      const result = processOrder(message.body);

      // Acknowledge success
      done();
    } catch (err) {
      // Reject — message will be retried or dead-lettered
      done(err);
    }
  },
  callback,
);
```

### Message Object

The `message` object provides:

| Property           | Description                  |
| ------------------ | ---------------------------- |
| `body`             | The message payload          |
| `id`               | Unique message identifier    |
| `ttl`              | Time-to-live in milliseconds |
| `retryThreshold`   | Max retry attempts           |
| `retryDelay`       | Delay between retries in ms  |
| `consumeTimeout`   | Max processing time in ms    |
| `priority`         | Priority level (if set)      |
| `status`           | Current message status       |
| `createdAt`        | Creation timestamp           |
| `destinationQueue` | The target queue             |

## Pub/Sub with Consumer Groups

For Pub/Sub queues, specify a group ID:

```javascript
consumer.consume(
  { queue: 'notifications', groupId: 'email-service' },
  (message, done) => {
    console.log('Email service processing:', message.body);
    done();
  },
  callback,
);
```

Each consumer group receives a copy of every message. Within a group, messages are load-balanced across consumers. See [Consumer Groups](https://github.com/weyoss/redis-smq-docs) for details.

## Managing Consumption

### Stop Consuming from a Queue

```javascript
consumer.cancel('orders', (err) => {
  if (err) console.error('Cancel failed:', err);
  else console.log('No longer consuming from orders');
});
```

### Check Registered Queues

```javascript
const queues = consumer.getQueues();
console.log('Registered queues:', queues);
```

### Shutdown

```javascript
// Stop this consumer
consumer.shutdown(callback);

// Or stop everything
RedisSMQ.shutdown(callback);
```

## Configuration

### Heartbeat TTL

```javascript
const consumer = new Consumer({
  heartbeatTTL: 30000, // Heartbeat expires after 30 seconds
});
```

### Batch Acknowledgments

```javascript
const consumer = new Consumer({
  batchAcks: {
    batchSize: 100, // Acknowledge in batches of 100
    batchTimeoutMs: 5000, // Or every 5 seconds
  },
});
```

### Batch Unacknowledgments

```javascript
const consumer = new Consumer({
  batchUnacks: {
    batchSize: 50,
    batchTimeoutMs: 5000,
  },
});
```

### Multiplexing

```javascript
// Share one Redis connection across multiple queues
const consumer = RedisSMQ.createConsumer(true);

consumer.consume('queue1', handler1, callback);
consumer.consume('queue2', handler2, callback);
consumer.consume('queue3', handler3, callback);
```

See [Multiplexing](multiplexing.md) and [Batch Acknowledgments](message-batch-acknowledgements.md) for details.

## Worker Threads

For CPU-intensive handlers, run the handler in a separate thread:

```javascript
const path = require('path');

consumer.consume(
  'image-processing',
  path.resolve(__dirname, 'handlers/image-processor.js'),
  callback,
);
```

See [Worker Threads](message-handler-worker-threads.md) for details.

## Message Lifecycle

Messages follow a lifecycle through the consumer:

```
Consumer dequeues message
  → Message moves from pending to processing
  → Handler processes the message
  → Success: done() → message acknowledged
  → Failure: done(err) → message retried or dead-lettered
```

See [Message Lifecycle](https://github.com/weyoss/redis-smq-docs) for the full walkthrough.

## Error Handling

### Callback Style

```javascript
consumer.consume(
  'orders',
  (message, done) => {
    try {
      processOrder(message.body);
      done();
    } catch (err) {
      console.error('Processing failed:', err);
      done(err); // Triggers retry
    }
  },
  (err) => {
    if (err) console.error('Consume registration failed:', err);
  },
);
```

### Promise Style

```javascript
await consumer.consume('orders', async (message) => {
  await processOrder(message.body);
  // Successful return = acknowledge
  // Thrown error = unacknowledge
});
```

## Best Practices

- **Make handlers idempotent** — messages can be delivered more than once
- **Keep handlers fast** — slow handlers block other messages on multiplexed consumers
- **Use retry delays** for transient failures (network, rate limits)
- **Set consume timeouts** to prevent stuck handlers from holding messages
- **Monitor dead-letter queues** for messages that fail repeatedly
- **Use batch acknowledgments** in high-throughput scenarios
- **Handle shutdown gracefully** — let in-flight messages complete

## Related

- [Message Reliability](https://github.com/weyoss/redis-smq-docs) — Delivery guarantees
- [Consumer Groups](https://github.com/weyoss/redis-smq-docs) — Pub/Sub with groups
- [Batch Acknowledgments](message-batch-acknowledgements.md) — Performance optimization
- [Multiplexing](multiplexing.md) — Shared connections
- [Worker Threads](message-handler-worker-threads.md) — CPU-heavy handlers
