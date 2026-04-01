[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EventBus

# Class: EventBus

The EventBus class provides a singleton interface for accessing a
distributed (Redis-based) event bus.

This allows components to communicate via events regardless of the deployment
topology. For example, a queue pause event can be broadcast to all consumers,
whether they are in the same process or distributed across multiple nodes.

## Example

```typescript
// Get the event bus instance
const eventBus = EventBus.getInstance();

// Subscribe to events
eventBus.on('queue.stateChanged', (event) => {
  console.log('Queue state changed:', event);
});

// Publish an event
eventBus.publish('queue.stateChanged', { queue: 'orders', state: 'PAUSED' });
```

## Methods

### getInstance()

> `static` **getInstance**(): `EventBusRedis`\<`TRedisSMQEvent`\>

Returns the singleton instance of the event bus.

This method creates the event bus instance if it doesn't exist yet,
using the configuration from `Configuration.getConfig()`. The instance
is cached for subsequent calls.

#### Returns

`EventBusRedis`\<`TRedisSMQEvent`\>

The singleton EventBusRedis instance

#### Example

```typescript
// Get instance and subscribe to events
const eventBus = EventBus.getInstance();
eventBus.on('queue.created', (data) => {
  console.log('Queue created:', data);
});

// Get instance and publish an event
const eventBus = EventBus.getInstance();
eventBus.publish('queue.created', { name: 'orders', ns: 'default' });
```

---

### shutdown()

#### Call Signature

> `static` **shutdown**(): `Promise`\<`void`\>

Shuts down the event bus instance and releases its resources.

This method gracefully shuts down the Redis connection used by the event bus
and clears the singleton instance. After shutdown, a new instance will be
created on the next call to `getInstance()`.

This is useful for:

- Graceful application shutdown
- Testing scenarios where you need to reset the event bus state
- Reconfiguring the event bus with new settings

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
EventBus.shutdown((err) => {
  if (err) {
    console.error('Failed to shutdown event bus:', err);
  } else {
    console.log('Event bus shut down successfully');
  }
});

// Promise pattern
try {
  await EventBus.shutdown();
  console.log('Event bus shut down successfully');
} catch (err) {
  console.error('Failed to shutdown event bus:', err);
}
```

#### Call Signature

> `static` **shutdown**(`cb`): `void`

Shuts down the event bus instance and releases its resources.

This method gracefully shuts down the Redis connection used by the event bus
and clears the singleton instance. After shutdown, a new instance will be
created on the next call to `getInstance()`.

This is useful for:

- Graceful application shutdown
- Testing scenarios where you need to reset the event bus state
- Reconfiguring the event bus with new settings

##### Parameters

###### cb

`ICallback`

Optional callback invoked when shutdown completes

##### Returns

`void`

- Returns a Promise if no callback is provided

##### Example

```typescript
// Callback pattern
EventBus.shutdown((err) => {
  if (err) {
    console.error('Failed to shutdown event bus:', err);
  } else {
    console.log('Event bus shut down successfully');
  }
});

// Promise pattern
try {
  await EventBus.shutdown();
  console.log('Event bus shut down successfully');
} catch (err) {
  console.error('Failed to shutdown event bus:', err);
}
```
