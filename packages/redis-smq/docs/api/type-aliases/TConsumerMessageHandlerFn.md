[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TConsumerMessageHandlerFn

# Type Alias: TConsumerMessageHandlerFn

> **TConsumerMessageHandlerFn** = [`TConsumerMessageHandlerCallback`](TConsumerMessageHandlerCallback.md) \| [`TConsumerMessageHandlerPromise`](TConsumerMessageHandlerPromise.md)

A handler function in either supported form.

The distinction between the two forms is not enforced at runtime. The
consumer calls every function handler with both arguments — the
message and a completion callback — and dispatches on the return
value: a thenable is awaited, a synchronous throw propagates, a
callback invocation settles the attempt. This makes the runtime
tolerant of wrappers (mocks, decorators) that do not preserve
`Function.length` accurately.

The union exists to document the two intended signatures, not to
constrain dispatch.
