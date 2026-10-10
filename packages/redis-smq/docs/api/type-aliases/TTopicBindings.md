[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TTopicBindings

# Type Alias: TTopicBindings

> **TTopicBindings** = `Record`\<`string`, [`IQueueParams`](../interfaces/IQueueParams.md)[]\>

A topic exchange's bindings.

Keys are binding patterns; values are the queues bound under each
pattern. A pattern with no bound queues never appears as a key — the
map only lists bindings that have at least one queue.

Structurally identical to `TDirectBindings` — both are
`Record<string, IQueueParams[]>` — but declared as a distinct alias
so that a future divergence (for example, if topic bindings gain a
per-pattern score or priority field) does not silently affect callers
who only asked for direct bindings. The two are currently
interchangeable at the type level; the distinct names document
which exchange type each is meant for.

This shape is the return of `IExchangeManager.getBindings` for a
topic exchange and of `IExchangeTopic.getBindings`.
