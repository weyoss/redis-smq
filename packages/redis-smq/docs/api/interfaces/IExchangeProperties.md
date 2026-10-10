[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IExchangeProperties

# Interface: IExchangeProperties

The properties of an exchange as stored in Redis and read back by
`_getExchangeProperties`.

Both fields are required. An exchange always has a type and a queue
policy — they are set at creation and never modified. There is no
"unset" state for either.

Unlike `IQueueProperties`, there are no counters or state fields:
an exchange has no runtime state of its own. Whether it has bound
queues, and which, is discovered by reading the exchange's binding
sets, not by reading a property.

## Properties

### queuePolicy

> **queuePolicy**: [`EExchangeQueuePolicy`](../enumerations/EExchangeQueuePolicy.md)

---

### type

> **type**: [`EExchangeType`](../enumerations/EExchangeType.md)
