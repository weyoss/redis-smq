[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TDirectBindings

# Type Alias: TDirectBindings

> **TDirectBindings** = `Record`\<`string`, [`IQueueParams`](../interfaces/IQueueParams.md)[]\>

A direct exchange's bindings.

Keys are routing keys; values are the queues bound under each key.
A routing key with no bound queues never appears as a key — the map
only lists bindings that have at least one queue.

This shape is the return of `IExchangeManager.getBindings` for a
direct exchange and of `IExchangeDirect.getBindings`.
