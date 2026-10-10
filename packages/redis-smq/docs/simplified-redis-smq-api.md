[RedisSMQ](../README.md) / [Documentation](README.md) / Simplified RedisSMQ API

# Simplified RedisSMQ API

The `RedisSMQ` class is the library's public entry point. It provides:

- **Two lifecycle methods** — `initialize()` and `shutdown()` — that bring the underlying machinery up and down.
- **Factory methods** that construct every component the library exposes.
- **Component tracking** — every component created through a factory is registered, and `shutdown()` tears all of them down in one call.

## Overview

```javascript
const { RedisSMQ } = require('redis-smq');

// 1. Initialize once
await RedisSMQ.initialize(redisConfig);

// 2. Create components via factory methods
const producer = RedisSMQ.createProducer();
const consumer = RedisSMQ.createConsumer();

// 3. One shutdown for everything
await RedisSMQ.shutdown();
```

## Initialization

Call once when your application starts, before any factory method:

```javascript
const { RedisSMQ } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

await RedisSMQ.initialize({
  client: ERedisConfigClient.IOREDIS,
  options: { host: '127.0.0.1', port: 6379 },
});
```

Calling a factory method (`createProducer()`, `createConsumer()`, and the rest) before `initialize()` resolves throws `PanicError`. There is no lazy initialization — the constraint is deliberate, so that an uninitialized library fails fast rather than half-working.

`initialize()` is transactional: if any step of the startup sequence fails, every resource acquired during the attempt is released and the state machine returns to `DOWN`, ready for a retry. See [Installation](installation.md) for the full startup sequence and its idempotency guarantees.

## Lifecycle

| Method                              | Purpose                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `RedisSMQ.initialize(redisConfig?)` | Connect to Redis and bring up the library.                                |
| `RedisSMQ.shutdown()`               | Stop every tracked component and release resources.                       |
| `RedisSMQ.isRunning()`              | `true` between a successful `initialize()` and the start of `shutdown()`. |

Both `initialize` and `shutdown` are idempotent:

- A call while the library is already in the target state resolves immediately.
- A call while a transition is in flight queues the caller behind the in-flight one.
- `initialize()` during shutdown, or `shutdown()` during initialization, rejects with `PanicError`.

## Factory Methods

### Producers

```javascript
// Create only — call run() before publishing
const producer = RedisSMQ.createProducer();
await producer.run();

// Create and start in one call
const started = await RedisSMQ.startProducer();
```

### Consumers

```javascript
// Default options
const consumer = RedisSMQ.createConsumer();

// With options
const consumer = RedisSMQ.createConsumer({
  enableMultiplexing: true,
  heartbeatTTL: 30000,
  batchAcks: { batchSize: 500, batchTimeoutMs: 2000 },
});

// Create and start in one call
const started = await RedisSMQ.startConsumer({
  enableMultiplexing: true,
});
```

See [Consuming Messages](consuming-messages.md) for the full options surface.

### Messages

```javascript
// A ProducibleMessage instance, ready to be configured
const msg = RedisSMQ.newProducibleMessage()
  .setQueue('orders')
  .setBody({ orderId: 123 });
```

### Managers

```javascript
const queueManager = RedisSMQ.createQueueManager();
const stateManager = RedisSMQ.createQueueStateManager();
const rateLimitManager = RedisSMQ.createQueueRateLimitManager();
const consumerGroups = RedisSMQ.createConsumerGroupsManager();
const messageManager = RedisSMQ.createMessageManager();
const namespaceManager = RedisSMQ.createNamespaceManager();
const configManager = RedisSMQ.createConfigManager();
const exchangeManager = RedisSMQ.createExchangeManager();
```

### Message Browsers

```javascript
const published = RedisSMQ.createQueuePublishedMessages();
const pending = RedisSMQ.createQueuePendingMessages();
const scheduled = RedisSMQ.createQueueScheduledMessages();
const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
```

The acknowledged and dead-lettered browsers require the corresponding message-audit category to be enabled. See [Message Audit](message-audit.md).

### Exchanges

```javascript
// Type-specific facades
const directExchange = RedisSMQ.createDirectExchange();
const topicExchange = RedisSMQ.createTopicExchange();
const fanoutExchange = RedisSMQ.createFanoutExchange();

// The unified manager, when the exchange type is a runtime value
const exchangeManager = RedisSMQ.createExchangeManager();
```

### Event Bus

```javascript
const eventBus = RedisSMQ.getEventBus();
await eventBus.run(); // the bus is not started automatically
eventBus.on('consumer.messageAcknowledged', (id, queue, consumerId) => {
  console.log(id);
});
```

See [Event Bus](event-bus.md) for the start-before-subscribe requirement.

### Queue Operation Validator

```javascript
const validator = RedisSMQ.createQueueOperationValidator();
const allowed = await validator.canConsume('orders');
```

The returned object is the `QueueOperationValidator` class itself (a static-only class), so `createQueueOperationValidator()` is a convenience that also performs the initialization check.

## Default Option Setters

Two static setters configure process-wide defaults for future instances:

```javascript
// Consumer defaults — heartbeat TTL, multiplexing, batch sizes
RedisSMQ.setDefaultConsumerOptions({
  enableMultiplexing: true,
  heartbeatTTL: 30000,
});

// ProducibleMessage consume options — TTL, retry policy, consume timeout
RedisSMQ.setDefaultMessageConsumeOptions({
  ttl: 60000,
  retryThreshold: 5,
  retryDelay: 30000,
});

// Read the current defaults
const consumerDefaults = RedisSMQ.getDefaultConsumerOptions();
const messageDefaults = RedisSMQ.getDefaultMessageConsumeOptions();
```

Defaults are **process-wide**: setting them changes the behavior of every consumer or message created afterward, in the current process. They do not affect other processes.

## Automatic Cleanup

Components created via factory methods are tracked by an internal registry. `RedisSMQ.shutdown()` shuts them all down, in addition to the connection pool, both event buses, the configuration sync, and the background-worker cluster:

```javascript
const producer = RedisSMQ.createProducer();
const consumer = RedisSMQ.createConsumer();
const queueManager = RedisSMQ.createQueueManager();

// ... use them ...

await RedisSMQ.shutdown(); // tears down every tracked component
```

If a tracked component has already been shut down individually, `RedisSMQ.shutdown()` calls `shutdown()` on it again. That second call is a no-op — `Runnable.shutdown()` is idempotent — so the sequence is safe.

## Individual Shutdown

You can stop a single component while keeping the rest running:

```javascript
await consumer.shutdown();
// producer, managers, and other consumers keep running
```

Components remain registered in the tracking set even after individual shutdown. The next `RedisSMQ.shutdown()` still calls `shutdown()` on them; the call is a no-op.

## Complete Example

```javascript
const { RedisSMQ, EQueueType, EQueueDeliveryModel } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

function fail(err) {
  console.error('Fatal:', err);
  process.exit(1);
}

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

  const producer = await RedisSMQ.startProducer();

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

main().catch(fail);

let shuttingDown = false;
process.on('SIGINT', async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    await RedisSMQ.shutdown();
    process.exit(0);
  } catch (err) {
    fail(err);
  }
});
```

## Best Practices

- **Initialize once at startup** — before any factory method is called
- **Use factory methods** so components are tracked for cleanup
- **Use a single `RedisSMQ.shutdown()`** at application exit — components created directly (not via a factory) must be shut down individually
- **Handle shutdown signals** (SIGINT, SIGTERM) with a `shuttingDown` guard so a second signal doesn't race the first
- **Set default options early** — before creating the components they should affect
- **Don't mix tracked and untracked components** — if a component is created directly (which is not possible for most of the library's public classes, since the concrete classes are not exported), shut it down yourself

## Related

- [Installation](installation.md) — Package setup and initialization sequence
- [Graceful Shutdown](graceful-shutdown.md) — What happens to in-flight work during shutdown
- [Consuming Messages](consuming-messages.md) — Consumer options and handler styles
- [Producing Messages](producing-messages.md) — Message construction and production
