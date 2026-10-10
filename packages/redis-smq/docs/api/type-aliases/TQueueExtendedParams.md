[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TQueueExtendedParams

# Type Alias: TQueueExtendedParams

> **TQueueExtendedParams** = `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) \| [`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

A queue identifier in any of the forms accepted by the public API.

- `string`: a bare queue name, resolved against the default namespace
- `IQueueParams`: `{ name, ns }`
- `IQueueParsedParams`: `{ queueParams, groupId }`

Methods that accept this type resolve it via `_parseQueueExtendedParams`
before doing any work.
