[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TConsumerMessageHandler

# Type Alias: TConsumerMessageHandler

> **TConsumerMessageHandler** = `string` \| [`TConsumerMessageHandlerFn`](TConsumerMessageHandlerFn.md)

A handler as accepted by `IConsumer.consume()`.

Three forms are supported:

- callback function: `(msg, cb) => void`
- promise function: `async (msg) => Promise<void>`
- module path: a string ending in `.js` or `.cjs`, resolved by the
  consumer and executed in a worker thread

The module-path form isolates a handler in its own thread so that a
CPU-bound or blocking handler does not stall the consumer's event
loop. The module must default-export a function matching one of the
two function forms above.

## Example

```ts
// Callback handler
const a: TConsumerMessageHandler = (msg, cb) => cb();

// Promise handler
const b: TConsumerMessageHandler = async (msg) => {
  await process(msg.getBody());
};

// Module path handler
const c: TConsumerMessageHandler = './handlers/order-handler.js';
```
