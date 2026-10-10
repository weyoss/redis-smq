[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TFanoutBindings

# Type Alias: TFanoutBindings

> **TFanoutBindings** = [`IQueueParams`](../interfaces/IQueueParams.md)[]

A fanout exchange's bindings.

A fanout exchange has no binding key — a queue is either bound to
the exchange or it is not, and the binding carries no additional
information. The bindings are therefore a flat list rather than a
map.

This shape is the return of `IExchangeManager.getBindings` for a
fanout exchange and of `IExchangeFanout.getBindings`. It is also
what `IExchangeFanout.matchQueues` returns, since for a fanout
exchange the match result is the entire binding set.
