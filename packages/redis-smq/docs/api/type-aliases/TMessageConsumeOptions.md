[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TMessageConsumeOptions

# Type Alias: TMessageConsumeOptions

> **TMessageConsumeOptions** = `Pick`\<[`IMessageParams`](../interfaces/IMessageParams.md), `"ttl"` \| `"retryThreshold"` \| `"retryDelay"` \| `"consumeTimeout"`\>

The subset of message options that affect consumption.

Used by `ProducibleMessage.setDefaultConsumeOptions()` and by the
internal consumer pipeline to read the message's TTL, retry policy,
and consume timeout without importing the whole `IMessageParams`
shape.

`IMessageParams` is used without a type argument on purpose: none of
the four picked fields depends on the body type, so the body parameter
is irrelevant to this projection.
