[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TExchangeBindings

# Type Alias: TExchangeBindings

> **TExchangeBindings** = [`TDirectBindings`](TDirectBindings.md) \| [`TTopicBindings`](TTopicBindings.md) \| [`TFanoutBindings`](TFanoutBindings.md)

The union of all binding shapes.

This is `IExchangeManager.getBindings`'s return type. A caller who
knows the exchange type at compile time should use the concrete
facade (`IExchangeDirect`, `IExchangeTopic`, `IExchangeFanout`),
whose `getBindings` returns the specific shape without a union.

The union exists because the manager's audience is callers who carry
the exchange type as a _runtime_ value — an `EExchangeType` read
from a config, a parameter passed through a dispatch function. Those
callers narrow the result at the call site:

    const bindings = await manager.getBindings(ex, type);
    if (type === EExchangeType.FANOUT) {
      // bindings is narrowed to IQueueParams[]
      for (const queue of bindings) { … }
    } else {
      // bindings is narrowed to Record<string, IQueueParams[]>
      for (const [key, queues] of Object.entries(bindings)) { … }
    }

The alternative — overloading `getBindings` on `type` so that each
literal `EExchangeType` narrows the return — would give callers a
precise type without the runtime check, at the cost of four overload
signatures per form (promise, promise-with-type, callback,
callback-with-type). The union is the honest shape for the
audience; the facades serve the callers who want precision without
the check.
