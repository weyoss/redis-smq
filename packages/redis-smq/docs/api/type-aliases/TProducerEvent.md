[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TProducerEvent

# Type Alias: TProducerEvent

> **TProducerEvent** = `object`

Producer events.

Emitted by `Producer` instances. Lifecycle events are one per producer;
`producer.messagePublished` fires once per destination queue a message
was produced to (and, for PUB/SUB queues, once per consumer group).

The producer's internal `PubSubTargetResolver` does not emit a public
event when it errors; a resolver failure tears the producer down and
is observable via the `producer.down` event plus the logs. A caller
that wants to react to resolver failures should watch `producer.down`
and reconnect.

## Properties

### producer.down

> **producer.down**: (`producerId`) => `void`

The producer has finished shutting down.

#### Parameters

##### producerId

`string`

#### Returns

`void`

---

### producer.goingDown

> **producer.goingDown**: (`producerId`) => `void`

The producer has started shutting down.

Fires at the beginning of `shutdown()`.

#### Parameters

##### producerId

`string`

#### Returns

`void`

---

### producer.goingUp

> **producer.goingUp**: (`producerId`) => `void`

The producer has started starting up.

#### Parameters

##### producerId

`string`

#### Returns

`void`

---

### producer.messagePublished

> **producer.messagePublished**: (`messageId`, `queue`, `producerId`) => `void`

A message was published to a destination queue.

Fires once per destination queue, and once per consumer group for
PUB/SUB destinations. A fan-out to N queues with M groups produces
up to N × M events, each with a distinct `messageId`.

Does not fire for scheduled messages. A message published with
scheduling parameters is placed in the scheduled set and does not
reach a pending queue until the schedule fires; the corresponding
`producer.messagePublished` event fires at that later point, from
the scheduled-message worker rather than from the producer.

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### producerId

`string`

#### Returns

`void`

---

### producer.up

> **producer.up**: (`producerId`) => `void`

The producer has finished starting up.

Fires after the producer's Redis connection is established and its
`PubSubTargetResolver` cache is loaded. Publishing is possible only
after this event fires.

#### Parameters

##### producerId

`string`

#### Returns

`void`
