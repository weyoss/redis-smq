[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EventBus

# Class: EventBus

The EventBus class provides a singleton interface for accessing a
distributed (Redis-based) event bus.

This allows components to communicate via events regardless of the deployment
topology. For example, a queue pause event can be broadcast to all consumers,
whether they are in the same process or distributed across multiple nodes.

## Methods

### getInstance()

> `static` **getInstance**(): `EventBusRedis`\<[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\>

Returns the singleton instance of the event bus.

#### Returns

`EventBusRedis`\<[`TRedisSMQEvent`](../type-aliases/TRedisSMQEvent.md)\>

---

### shutdown()

> `static` **shutdown**(`cb`): `void`

Shuts down the event bus instance and releases its resources.
After shutdown, the instance is reset, and a new one will be created
on the next call to `getInstance()`.

#### Parameters

##### cb

`ICallback`

A callback to be invoked once shutdown is complete.

#### Returns

`void`
