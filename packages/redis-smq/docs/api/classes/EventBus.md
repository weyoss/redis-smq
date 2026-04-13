[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / EventBus

# Class: EventBus

Singleton distributed event bus for RedisSMQ.

Provides Redis-based event communication across components and deployments.
Must be started with `run()` before events are delivered.

## Example

```ts
const eventBus = EventBus.getInstance();
await eventBus.run();

eventBus.on('queue.queueCreated', (queue, properties) => {
  console.log('Queue created:', queue.name);
});
```

## Methods

### getInstance()

> `static` **getInstance**(): `EventBusRedis`\<[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\>

Gets the singleton event bus instance.

#### Returns

`EventBusRedis`\<[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\>

EventBusRedis instance

#### Example

```ts
const eventBus = EventBus.getInstance();
await eventBus.run();
```

---

### shutdown()

#### Call Signature

> `static` **shutdown**(): `Promise`\<`void`\>

Shuts down the event bus and releases resources.

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await EventBus.shutdown();

// Callback
EventBus.shutdown((err) => {
  if (err) throw err;
});
```

#### Call Signature

> `static` **shutdown**(`cb`): `void`

Shuts down the event bus and releases resources.

##### Parameters

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

##### Example

```ts
// Promise
await EventBus.shutdown();

// Callback
EventBus.shutdown((err) => {
  if (err) throw err;
});
```
