[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / withEventBus

# Function: withEventBus()

> **withEventBus**\<`S`, `T`\>(`eventBusRedisFactory`, `operation`, `callback`): `void`

A helper function for executing operations with an event bus instance

This function provides a standardized way to:
1. Get or create an event bus instance
2. Execute an operation with the event bus
3. Handle the callback with the result

## Type Parameters

### S

`S` *extends* [`TEventBusEvent`](../type-aliases/TEventBusEvent.md)

### T

`T`

## Parameters

### eventBusRedisFactory

[`EventBusRedisFactory`](../classes/EventBusRedisFactory.md)\<`S`\>

The factory that provides the event bus instance

### operation

(`eventBus`, `cb`) => `void`

The operation to execute with the event bus

### callback

[`ICallback`](../interfaces/ICallback.md)\<`T`\>

The callback to invoke with the final result

## Returns

`void`

## Typeparam

S - The type of events supported by the event bus

## Typeparam

T - The type of data returned by the operation
