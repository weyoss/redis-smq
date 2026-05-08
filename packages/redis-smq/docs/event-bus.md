# Event Bus

Monitor RedisSMQ's internal activity by subscribing to system events. Track message flow, consumer status, and system health in real time.

## Quick Start

```javascript
import { EventBus } from 'redis-smq';

// Get the event bus instance
const eventBus = EventBus.getInstance();

// Start the event bus
eventBus.run((err) => {
  if (err) console.error('Failed to start:', err);
  else console.log('Event bus running');
});

// Subscribe to events
eventBus.on(
  'consumer.consumeMessage.messageAcknowledged',
  (messageId, queue, messageHandlerId, consumerId) => {
    console.log(`Message ${messageId} acknowledged`);
  },
);
```

## Available Events

### Queue Events

```javascript
eventBus.on('queue.queueCreated', (queue, properties) => { ... });
eventBus.on('queue.queueDeleted', (queue) => { ... });
eventBus.on('queue.stateChanged', (queue, transition) => { ... });
eventBus.on('queue.consumerGroupCreated', (queue, groupId) => { ... });
eventBus.on('queue.consumerGroupDeleted', (queue, groupId) => { ... });
```

### Producer Events

```javascript
eventBus.on('producer.up', (producerId) => { ... });
eventBus.on('producer.down', (producerId) => { ... });
eventBus.on('producer.messagePublished', (messageId, queue, producerId) => { ... });
```

### Consumer Events

```javascript
eventBus.on('consumer.up', (consumerId) => { ... });
eventBus.on('consumer.down', (consumerId) => { ... });

// Message processing
eventBus.on('consumer.consumeMessage.messageAcknowledged', (messageId, queue, handlerId, consumerId) => { ... });
eventBus.on('consumer.consumeMessage.messageUnacknowledged', (messageId, queue, handlerId, consumerId, cause) => { ... });
eventBus.on('consumer.consumeMessage.messageDeadLettered', (messageId, queue, handlerId, consumerId, cause) => { ... });
eventBus.on('consumer.consumeMessage.messageRequeued', (messageId, queue, handlerId, consumerId) => { ... });
eventBus.on('consumer.consumeMessage.messageDelayed', (messageId, queue, handlerId, consumerId) => { ... });

// Dequeue
eventBus.on('consumer.dequeueMessage.messageReceived', (messageId, queue, consumerId) => { ... });

// Heartbeat
eventBus.on('consumerHeartbeat.heartbeat', (consumerId, timestamp) => { ... });
```

### Configuration Events

```javascript
eventBus.on('configuration.updated', (config, version) => { ... });
```

## Unsubscribing

```javascript
const handler = (messageId) => console.log(messageId);
eventBus.on('consumer.consumeMessage.messageAcknowledged', handler);

// Later, remove the handler
eventBus.removeListener('consumer.consumeMessage.messageAcknowledged', handler);
```

## Shutdown

```javascript
// Stop the event bus
await EventBus.shutdown();

// Or let RedisSMQ.shutdown() handle it
await RedisSMQ.shutdown();
```

## Best Practices

- **Start early** — start the event bus before creating producers and consumers to capture all events
- **Keep handlers fast** — handlers run synchronously; don't block the event loop
- **Unsubscribe when done** — remove listeners to prevent memory leaks
- **Redis-backed for distribution** - Events are visible across all application instances

## Related

- [Event Bus Concepts](https://github.com/weyoss/redis-smq-docs) — How the event bus works
- [TRedisSMQEvent](api/type-aliases/TRedisSMQEvent.md) - All available events
