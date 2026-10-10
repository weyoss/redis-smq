[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TConsumerMessageHandlerCallback

# Type Alias: TConsumerMessageHandlerCallback

> **TConsumerMessageHandlerCallback** = (`msg`, `cb`) => `void`

A callback-style message handler.

Invoked with the message and a completion callback. The handler must
call `cb` exactly once — with no arguments on success, or with an
`Error` on failure. Calling `cb` more than once is tolerated (the
second call is a no-op) but logs a warning at the consumer level.

A synchronous throw from the handler is treated the same as calling
`cb(error)`: the message is unacknowledged with
`EMessageUnacknowledgementCause.UNACKNOWLEDGED` (or a more specific
cause, for errors the consumer recognizes).

## Parameters

### msg

[`IMessageTransferable`](../interfaces/IMessageTransferable.md)

### cb

`ICallback`\<`void`\>

## Returns

`void`

## Example

```ts
const handler: TConsumerMessageHandlerCallback = (msg, cb) => {
  process(msg.getBody(), (err) => cb(err));
};
```
