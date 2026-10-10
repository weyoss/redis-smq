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

A handler can be written in one of two function styles, or given as a path to a module:

| Style       | Signature                          | Completion signal                                                            |
| ----------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| Callback    | `(message, done) => void`          | `done()` acks; `done(err)` unacks                                            |
| Promise     | `async (message) => Promise<void>` | resolution acks; rejection unacks                                            |
| Module path | `'./handlers/order-handler.js'`    | loaded in a worker thread; must default-export one of the two function forms |

The distinction between the two function forms is not enforced at runtime — a handler is invoked with both arguments, and the outcome is decided by whichever of the following fires first: a synchronous throw, the returned thenable settling, or the callback being invoked. The arity is a hint, not a contract.

### Callback Style

```javascript
consumer.consume(
  'orders',
  (message, done) => {
    try {
      processOrder(message.body);
      done(); // Acknowledge success
    } catch (err) {
      done(err); // Reject — message will be retried or dead-lettered
    }
  },
  callback,
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

### Message Object

The `message` argument is an `IMessageTransferable`. Its fields:

| Property           | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `id`               | Unique message identifier                                 |
| `body`             | The message payload                                       |
| `status`           | Current message status (`EMessagePropertyStatus`)         |
| `messageState`     | Runtime state — timestamps, attempts, counters            |
| `createdAt`        | Creation timestamp, in milliseconds since the epoch       |
| `ttl`              | Time-to-live in milliseconds (0 = never expires)          |
| `retryThreshold`   | Max processing attempts before dead-lettering             |
| `retryDelay`       | Delay between retries, in milliseconds                    |
| `consumeTimeout`   | Max processing time in milliseconds (0 = no timeout)      |
| `priority`         | Priority level, or `null` for non-priority queues         |
| `destinationQueue` | The queue the message was routed to                       |
| `consumerGroupId`  | The consumer group ID for Pub/Sub queues, or `null`       |
| `exchange`         | The exchange the message was published through, or `null` |

`attempts`, `acknowledgedAt`, `deadLetteredAt`, and the other lifecycle counters live on `message.messageState`, not at the top level.

## Pub/Sub with Consumer Groups

For Pub/Sub queues, specify a group ID by wrapping the queue params in a `queueParams` object:

```javascript
consumer.consume(
  {
    queueParams: { name: 'notifications', ns: 'default' },
    groupId: 'email-service',
  },
  (message, done) => {
    console.log('Email service processing:', message.body);
    done();
  },
  callback,
);
```

The queue argument accepts one of three shapes:

| Shape                                         | Group ID                 |
| --------------------------------------------- | ------------------------ |
| `'notifications'`                             | None (default namespace) |
| `{ name: 'notifications', ns: 'production' }` | None                     |
| `{ queueParams: { name, ns }, groupId }`      | Required for Pub/Sub     |

A bare `{ queue, groupId }` object is **not** a valid queue argument. The `groupId` must be nested inside a wrapper that also carries `queueParams`.

Each consumer group receives a copy of every message. Within a group, messages are load-balanced across consumers. See [Consumer Groups](consumer-groups.md) for the group lifecycle.

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

// Each entry includes the effective consumer group ID (if any)
const withStatus = consumer.getQueuesWithStatus();
withStatus.forEach(({ queue, status }) => {
  console.log(`${queue.queueParams.name}: ${status}`); // 'active' or 'stopped'
});
```

### Shutdown

```javascript
// Stop this consumer
consumer.shutdown(callback);

// Or stop everything
RedisSMQ.shutdown(callback);
```

## Configuration

Pass options to the `createConsumer` factory.

### Heartbeat TTL

```javascript
const consumer = RedisSMQ.createConsumer({
  heartbeatTTL: 30000, // Heartbeat expires after 30 seconds (default 60000)
});
```

A shorter TTL detects dead consumers faster but risks false positives under transient pauses.

### Batch Acknowledgments

```javascript
const consumer = RedisSMQ.createConsumer({
  batchAcks: {
    batchSize: 100, // Max messages per batch
    batchTimeoutMs: 5000, // Or flush after this many ms
  },
});
```

### Batch Unacknowledgments

```javascript
const consumer = RedisSMQ.createConsumer({
  batchUnacks: {
    batchSize: 50,
    batchTimeoutMs: 5000,
  },
});
```

### Multiplexing

```javascript
// Share one Redis connection across all queues handled by this consumer
const consumer = RedisSMQ.createConsumer({ enableMultiplexing: true });

consumer.consume('queue1', handler1, callback);
consumer.consume('queue2', handler2, callback);
consumer.consume('queue3', handler3, callback);
```

With multiplexing, handlers on the same consumer process messages sequentially rather than in parallel. See [Multiplexing](multiplexing.md) and [Batch Acknowledgments](message-batch-acknowledgements.md) for the trade-offs.

## Worker Threads

For CPU-intensive handlers, pass a module path instead of a function. The handler runs in a separate worker thread:

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
  → Success: done() or Promise resolves → message acknowledged
  → Failure: done(err), throw, or Promise rejects → message retried or dead-lettered
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

### Callback Style Note

A handler is permitted to return before calling `done()`. RedisSMQ waits for the callback — it does not treat "the handler returned" as an acknowledgment. This lets you do asynchronous work between the call and the callback:

```javascript
consumer.consume('orders', (message, done) => {
  setTimeout(() => {
    processOrder(message.body);
    done();
  }, 1000);
});
```

If the handler throws after calling `done()`, the throw is discarded — the callback settles the outcome.

## Best Practices

- **Make handlers idempotent** — messages can be delivered more than once
- **Keep handlers fast** — slow handlers block other queues on multiplexed consumers
- **Use retry delays** for transient failures (network, rate limits)
- **Set consume timeouts** to prevent stuck handlers from holding messages
- **Monitor dead-letter queues** for messages that fail repeatedly
- **Use batch acknowledgments** in high-throughput scenarios
- **Handle shutdown gracefully** — let in-flight messages complete

## Related

- [Message Reliability](https://github.com/weyoss/redis-smq-docs) — Delivery guarantees
- [Consumer Groups](consumer-groups.md) — Pub/Sub with groups
- [Batch Acknowledgments](message-batch-acknowledgements.md) — Performance optimization
- [Multiplexing](multiplexing.md) — Shared connections
- [Worker Threads](message-handler-worker-threads.md) — CPU-heavy handlers
