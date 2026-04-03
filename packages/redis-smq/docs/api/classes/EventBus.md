[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EventBus

# Class: EventBus

The EventBus class provides a singleton interface for accessing a
distributed (Redis-based) event bus.

This allows components to communicate via events regardless of the deployment
topology.

**Important:** The event bus must be explicitly started via `run()` to begin
consuming and delivering events. Events published before `run()` are not delivered.

## Example

```typescript
// Get the event bus instance
const eventBus = EventBus.getInstance();

// Start the event bus to begin consuming events
eventBus.run((err) => {
  if (err) console.error('Failed to start event bus:', err);
});

// Subscribe to events (can be done before or after run())
eventBus.on('queue.stateChanged', (event) => {
  console.log('Queue state changed:', event);
});

// Publish an event (only delivered if bus is running)
eventBus.emit('queue.stateChanged', { queue: 'orders', state: 'PAUSED' });
```

## Methods

### getInstance()

> `static` **getInstance**(): `EventBusRedis`\<[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\>

Returns the singleton instance of the event bus.

This method creates the event bus instance if it doesn't exist yet,
using the Redis configuration from `RedisConfig.getConfig()`.

**Note:** The instance is created regardless of any configuration settings.
However, you must call `run()` on the returned instance to start consuming events.

#### Returns

`EventBusRedis`\<[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\>

The singleton EventBusRedis instance

#### Example

```typescript
// Get instance and start it
const eventBus = EventBus.getInstance();
await eventBus.run();

// Subscribe to events
eventBus.on('queue.created', (data) => {
  console.log('Queue created:', data);
});
```

---

### shutdown()

#### Call Signature

> `static` **shutdown**(): `Promise`\<`void`\>

Shuts down the event bus instance and releases its resources.

This method gracefully shuts down the Redis connections used by the event bus
and clears the singleton instance. After shutdown, a new instance will be
created on the next call to `getInstance()`.

This is useful for:

- Graceful application shutdown
- Testing scenarios where you need to reset the event bus state

**Note:** `RedisSMQ.shutdown()` automatically calls this method.

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

This method gracefully shuts down the Redis connections used by the event bus
and clears the singleton instance. After shutdown, a new instance will be
created on the next call to `getInstance()`.

This is useful for:

- Graceful application shutdown
- Testing scenarios where you need to reset the event bus state

**Note:** `RedisSMQ.shutdown()` automatically calls this method.

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
