[RedisSMQ](../README.md) / [Documentation](README.md) / EventBus

# EventBus

Monitor RedisSMQ's internal activity by subscribing to system events. Track message flow, consumer status, and system health in real-time.

## Quick Start

### 1. Get EventBus Instance and Start It

The EventBus must be explicitly started via `run()` to begin consuming events. Events published before `run()` are not delivered.

```javascript
import { EventBus } from 'redis-smq';

// Get instance (always available, doesn't depend on config)
const eventBus = EventBus.getInstance();

// Start the event bus to begin consuming events
eventBus.run((err) => {
  if (err) console.error('Failed to start event bus:', err);
  else console.log('Event bus started, ready to receive events');
});
```

### 2. Subscribe to Events

```javascript
// Subscribe before or after run() - both work
eventBus.on(
  'consumer.consumeMessage.messageAcknowledged',
  (messageId, queue, messageHandlerId, consumerId) => {
    console.log(`✅ Message ${messageId} acknowledged`);
  },
);

eventBus.on(
  'consumer.consumeMessage.messageDeadLettered',
  (messageId, queue, messageHandlerId, consumerId, deadLetterCause) => {
    console.log(`💀 Message ${messageId} dead-lettered`);
  },
);
```

### 3. Events Are Automatically Published by the System

Once the event bus is running, RedisSMQ automatically publishes events to it. No manual publishing needed.

```javascript
// System automatically emits events like:
// - When messages are produced
// - When consumers process messages
// - When queues are created/deleted
// - When configuration changes
// - etc.
```

## Complete Setup Example

```javascript
import { RedisSMQ, EventBus } from 'redis-smq';

// 1. Initialize RedisSMQ
await RedisSMQ.initialize({
  client: ERedisConfigClient.IOREDIS,
  options: { host: '127.0.0.1', port: 6379 },
});

// 2. Get and start event bus
const eventBus = EventBus.getInstance();
await eventBus.run();

// 3. Subscribe to events
eventBus.on('consumer.consumeMessage.messageAcknowledged', (messageId) => {
  console.log(`Message ${messageId} processed`);
});

// 4. Events now flow automatically
```

## Available Events

See [TRedisSMQEvent](api/type-aliases/TRedisSMQEvent.md).

## Best Practices

### 1. Start Event Bus Early

```javascript
// ✅ Start before creating producers/consumers
await RedisSMQ.initialize(redisConfig);
await eventBus.run();
const producer = await RedisSMQ.createProducer(); // Events will be captured

// ❌ Starting too late misses events
await RedisSMQ.initialize(redisConfig);
const producer = await RedisSMQ.createProducer(); // Startup events lost
await eventBus.run(); // Too late for initialization events
```

### 2. Keep Handlers Non-Blocking

```javascript
// ✅ Good - async without blocking
eventBus.on(
  'consumer.consumeMessage.messageAcknowledged',
  async (messageId) => {
    await logToDatabase(messageId); // Non-blocking
  },
);

// ❌ Bad - synchronous blocking
eventBus.on('consumer.consumeMessage.messageAcknowledged', (messageId) => {
  heavySyncOperation(); // Blocks other events
});
```

### 3. Clean Up Subscriptions

```javascript
const handler = (messageId) => console.log(messageId);
eventBus.on('consumer.consumeMessage.messageAcknowledged', handler);

// When no longer needed
eventBus.removeListener('consumer.consumeMessage.messageAcknowledged', handler);
```

## Shutdown

### Graceful Shutdown with RedisSMQ

```javascript
// EventBus shuts down automatically with RedisSMQ.shutdown()
await RedisSMQ.shutdown();
// EventBus is automatically stopped and cleaned up
```

### Manual Shutdown

```javascript
await EventBus.shutdown();
```

## Important Notes

1. **No configuration required** - `EventBus` is always available, no `eventBus.enabled` setting needed
2. **Must call `run()`** - Event bus must be explicitly started to consume events
3. **Events published before `run()` are lost** - Start early to capture all events
4. **Redis-backed for distribution** - Events are visible across all application instances

---

**Related**:

- [EventBus API](api/classes/EventBus.md) - Complete API details
- [TRedisSMQEvent](api/type-aliases/TRedisSMQEvent.md) - All available events
