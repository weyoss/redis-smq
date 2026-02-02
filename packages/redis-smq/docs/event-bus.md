[RedisSMQ](../README.md) / [Docs](README.md) / EventBus

# EventBus

Monitor RedisSMQ's internal activity by subscribing to system events. Track message flow, consumer status, and system
health in real-time.

## Quick Start

### 1. Enable EventBus in Configuration

```javascript
const config = {
  eventBus: { enabled: true }, // Add this
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
};

// Use initializeWithConfig ONLY for first-time setup or changing RedisSMQ configuration
RedisSMQ.initializeWithConfig(config, (err) => {
  if (err) console.error('Failed:', err);
  else console.log('EventBus enabled');
});
```

### 2. Subscribe to Events

```javascript
const { EventBus } = require('redis-smq');

const eventBus = EventBus.getInstance();

// Track message acknowledgments
eventBus.on(
  'consumer.consumeMessage.messageAcknowledged',
  (messageId, queue, messageHandlerId, consumerId) => {
    console.log(`✅ Message ${messageId} acknowledged from ${queue.name}`);
  },
);

// Track failures
eventBus.on(
  'consumer.consumeMessage.messageDeadLettered',
  (messageId, queue, messageHandlerId, consumerId, deadLetterReason) => {
    console.log(`💀 Message ${messageId} failed:`, error);
  },
);
```

## Available Events

### Sample Consumer Events

```javascript
// Message flow
'consumer.consumeMessage.messageAcknowledged';
'consumer.consumeMessage.messageUnacknowledged';
'consumer.consumeMessage.messageDeadLettered';
'consumer.consumeMessage.messageRequeued';
//...
```

### Sample Producer Events

```javascript
'producer.up';
'producer.down';
'producer.messagePublished';
//...
```

### Queue Events

```javascript
'queue.queueCreated';
'queue.queueDeleted';
//...
```

## Real-World Examples

### Monitor System Health

```javascript
eventBus.on(
  'consumerHeartbeat.heartbeat',
  (consumerId, timestamp, heartbeatPayload) => {
    console.log(`❤️  Consumer ${consumerId} alive at ${timestamp}`);
  },
);

eventBus.on('consumer.error', (err, consumerId) => {
  console.warn(`⚠️  Consumer ${consumerId} stopped:`, err);
});
```

### Track Message Flow

```javascript
eventBus.on(
  'consumer.dequeueMessage.messageReceived',
  (messageId, queue, consumerId) => {
    console.log(`📥 Received ${messageId} from ${queue.name}`);
  },
);

eventBus.on(
  'consumer.consumeMessage.messageAcknowledged',
  (messageId, queue, messageHandlerId, consumerId) => {
    console.log(`✅ Processed ${messageId} from ${queue.name}`);
  },
);
```

### Debug Failures

```javascript
eventBus.on(
  'consumer.consumeMessage.messageRetrying',
  (messageId, queue, retryCount, error) => {
    console.log(`🔄 Retry ${retryCount} for ${messageId}:`, error.message);
  },
);

eventBus.on(
  'consumer.consumeMessage.messageDeadLettered',
  (messageId, queue, messageHandlerId, consumerId, deadLetterReason) => {
    console.error(`💀 Dead lettered ${messageId}:`, {
      queue: queue.name,
      reason: EMessageUnacknowledgementDeadLetterReason[deadLetterReason],
      timestamp: new Date(),
    });
  },
);
```

## Best Practices

### 1. Enable Only When Needed

```javascript
// Development/Staging
eventBus: {
  enabled: true;
}

// Production (monitoring only)
eventBus: {
  enabled: process.env.NODE_ENV === 'production';
}
```

### 2. Keep Handlers Fast

```javascript
// ✅ Good - async logging
eventBus.on(
  'consumer.consumeMessage.messageAcknowledged',
  async (messageId) => {
    await logToExternalService(messageId);
  },
);

// ❌ Avoid - blocking operations
eventBus.on('consumer.consumeMessage.messageAcknowledged', (messageId) => {
  heavySyncOperation(); // Blocks other events
});
```

### 3. Clean Up Subscriptions

```javascript
// Store reference to remove later
const handler = (messageId) => console.log(messageId);
eventBus.on('consumer.consumeMessage.messageAcknowledged', handler);

// Remove when done
eventBus.removeListener('consumer.consumeMessage.messageAcknowledged', handler);
```

## Setup Requirements

### 1. Must Enable Before Initialization

```javascript
// ✅ Correct
RedisSMQ.initializeWithConfig({ eventBus: { enabled: true } });

// ❌ Wrong (won't work)
RedisSMQ.initializeWithConfig(config);
// Later...
config.eventBus = { enabled: true }; // Too late!
```

### 2. Get Instance After Initialization

```javascript
RedisSMQ.initialize(redisConfig, (err) => {
  if (err) throw err;

  // ✅ Now it's safe
  const eventBus = EventBus.getInstance();

  // Subscribe to events...
});
```

## Shutdown

### Recommended: Let RedisSMQ Handle It

```javascript
// Clean shutdown of everything
RedisSMQ.shutdown((err) => {
  if (err) console.error('Shutdown error:', err);
});
```

### Manual Shutdown (Advanced)

```javascript
// Only if not using RedisSMQ.shutdown()
EventBus.shutdown((err) => {
  if (err) console.error('EventBus shutdown error:', err);
});
```

---

**Related**:

- [EventBus API](api/classes/EventBus.md) - Compete API details.
- [TRedisSMQEvent](api/type-aliases/TRedisSMQEvent.md) - Complete event list.
- [Configuration](configuration.md) - Setup options
