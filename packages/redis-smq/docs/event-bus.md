[RedisSMQ](../README.md) / [Documentation](README.md) / Event Bus

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
eventBus.on('consumer.messageAcknowledged', (messageId, queue, consumerId) => {
  console.log(`Message ${messageId} acknowledged`);
});
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
eventBus.on('consumer.messageAcknowledged', (messageId, queue, consumerId) => { ... });
eventBus.on('consumer.messageUnacknowledged', (messageId, queue, consumerId, cause) => { ... });
eventBus.on('consumer.messageDeadLettered', (messageId, queue, consumerId, cause) => { ... });
eventBus.on('consumer.messageRequeued', (messageId, queue, consumerId) => { ... });
eventBus.on('consumer.messageDelayed', (messageId, queue, consumerId) => { ... });

// Message received (dequeued)
eventBus.on('consumer.messageReceived', (messageId, queue, consumerId) => { ... });
```

### Configuration Events

```javascript
eventBus.on('configuration.updated', (config, version) => { ... });
```

## Unsubscribing

```javascript
const handler = (messageId) => console.log(messageId);
eventBus.on('consumer.messageAcknowledged', handler);

// Later, remove the handler
eventBus.removeListener('consumer.messageAcknowledged', handler);
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
