[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TConsumerMessageHandlerPromise

# Type Alias: TConsumerMessageHandlerPromise

> **TConsumerMessageHandlerPromise** = (`msg`) => `Promise`\<`void`\>

A promise-style message handler.

Invoked with the message. The consumer awaits the returned promise:
resolution is treated as success, rejection as failure with the
rejection value as the error.

## Parameters

### msg

[`IMessageTransferable`](../interfaces/IMessageTransferable.md)

## Returns

`Promise`\<`void`\>

## Example

```ts
const handler: TConsumerMessageHandlerPromise = async (msg) => {
  await process(msg.getBody());
};
```
