````markdown
[RedisSMQ](../README.md) / [Documentation](README.md) / Event Bus

# Event Bus

Monitor RedisSMQ's internal activity by subscribing to system events. Track message flow, consumer status, and system health in real time.

## Quick Start

```javascript
const { RedisSMQ } = require('redis-smq');

// Get the event bus instance
const eventBus = RedisSMQ.getEventBus();

// Start the bus. Until this completes, every event the library emits
// is silently dropped — the bus does not queue or replay events for
// a subscriber that has not connected yet.
await eventBus.run();

// Subscribe to events
eventBus.on('consumer.messageAcknowledged', (messageId, queue, consumerId) => {
  console.log(`Message ${messageId} acknowledged by ${consumerId}`);
});
```
````

## Before You Subscribe

The event bus is created lazily but is **not started automatically**. Two consequences matter:

- **Events published before `run()` completes are lost.** The library emits events only on a running bus; anything emitted before `await eventBus.run()` resolves is gone. There is no queueing, no replay, no buffer.
- **`RedisSMQ.shutdown()` stops the bus if it was started** — the caller starts it, the library stops it. If you never called `run()`, shutdown is a no-op for the bus; it does not start it.

The ordering rule that falls out of this: **start the bus before creating any producer or consumer whose events you care about.** In a typical process that means calling `RedisSMQ.initialize()` and then `await RedisSMQ.getEventBus().run()` before wiring up the rest of your components.

## Available Events

### Queue Events

Payload shape: `queue` is `IQueueParams` (name and namespace only).

```javascript
eventBus.on('queue.queueCreated', (queue, properties) => { ... });
eventBus.on('queue.queueDeleted', (queue) => { ... });
eventBus.on('queue.stateChanged', (queue, transition) => { ... });
eventBus.on('queue.consumerGroupCreated', (queue, groupId) => { ... });
eventBus.on('queue.consumerGroupDeleted', (queue, groupId) => { ... });
```

### Producer Events

Payload shape: `queue` on `producer.messagePublished` is `IQueueParsedParams` (name, namespace, and the effective consumer group ID).

```javascript
eventBus.on('producer.up', (producerId) => { ... });
eventBus.on('producer.goingUp', (producerId) => { ... });
eventBus.on('producer.goingDown', (producerId) => { ... });
eventBus.on('producer.down', (producerId) => { ... });
eventBus.on('producer.messagePublished', (messageId, queue, producerId) => { ... });
```

### Consumer Events

Payload shape: `queue` is `IQueueParsedParams` on every consumer event — it carries the effective consumer group ID.

```javascript
// Lifecycle
eventBus.on('consumer.up', (consumerId) => { ... });
eventBus.on('consumer.goingUp', (consumerId) => { ... });
eventBus.on('consumer.goingDown', (consumerId) => { ... });
eventBus.on('consumer.down', (consumerId) => { ... });

// Message processing
eventBus.on('consumer.messageReceived', (messageId, queue, consumerId) => { ... });
eventBus.on('consumer.messageAcknowledged', (messageId, queue, consumerId) => { ... });
eventBus.on('consumer.messageUnacknowledged', (messageId, queue, consumerId, cause) => { ... });
eventBus.on('consumer.messageDeadLettered', (messageId, queue, consumerId, cause) => { ... });
eventBus.on('consumer.messageRequeued', (messageId, queue, consumerId) => { ... });
eventBus.on('consumer.messageDelayed', (messageId, queue, consumerId) => { ... });
```

### Configuration Events

```javascript
eventBus.on('configuration.updated', (config, version) => { ... });
```

### Two Buses

The library runs two event buses with disjoint audiences:

- **The user bus** (this page) — the events listed above. Application code subscribes here.
- **The internal bus** — coordination events between library components, such as configuration sync and cross-process queue state notifications. Application code does not subscribe here, and its channel is separate.

Some events are published on both buses via the multiplexer. `queue.queueCreated` and `queue.stateChanged`, for example, appear on the public bus for observability and on the internal bus for coordination. A subscriber to the public bus sees them once; the internal copy is consumed by the library.

## Unsubscribing

```javascript
const handler = (messageId) => console.log(messageId);
eventBus.on('consumer.messageAcknowledged', handler);

// Later, remove the handler
eventBus.removeListener('consumer.messageAcknowledged', handler);
```

## Shutdown

```javascript
// Stop the bus explicitly while keeping the rest of the library running
await eventBus.shutdown();

// Or let RedisSMQ.shutdown() handle it along with every other component
await RedisSMQ.shutdown();
```

`RedisSMQ.shutdown()` stops the bus if it was started. If the caller never called `run()`, the shutdown is a no-op for the bus.

## Best Practices

- **Start before your components** — call `run()` before creating producers and consumers, or you will silently miss the events they emit at startup. There is no replay.
- **Keep handlers fast** — handlers run synchronously on the bus's event loop; a slow handler blocks delivery to every other subscriber.
- **Unsubscribe when done** — remove listeners you no longer need to prevent unbounded handler accumulation.
- **Distributed by default** — events are delivered across every process connected to the same Redis instance, not just the local one. A subscriber in process B sees events emitted by process A.

## Related

- [Event Bus Concepts](https://github.com/weyoss/redis-smq-docs) — How the event bus works
- [TRedisSMQEvent](api/type-aliases/TRedisSMQEvent.md) — The complete event type map
- [Queue State Management](queue-state-management.md) — Subscribing to `queue.stateChanged`
