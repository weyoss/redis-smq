[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TQueueEvent

# Type Alias: TQueueEvent

> **TQueueEvent** = `object`

Queue events.

Emitted by the queue-management layer — `QueueManager`,
`NamespaceManager`, `ConsumerGroups`, `QueueStateManager` — and by any
operation that changes a queue's state or membership.

The queue payload here is `IQueueParams` (name + namespace), not
`IQueueParsedParams`. Queue-level events describe the queue as a
whole; the consumer-group dimension is present on consumer message
events, not on queue events. A subscriber who needs the group ID in
the context of a queue event correlates by queue name.

## Properties

### queue.consumerGroupCreated

> **queue.consumerGroupCreated**: (`queue`, `groupId`) => `void`

A consumer group was created on a queue.

Fires once per successful creation. A no-op call (the group already
existed) does not fire the event — the return value of
`IConsumerGroups.saveConsumerGroup` is the authoritative signal for
"created" vs. "already existed".

#### Parameters

##### queue

[`IQueueParams`](../interfaces/IQueueParams.md)

##### groupId

`string`

#### Returns

`void`

---

### queue.consumerGroupDeleted

> **queue.consumerGroupDeleted**: (`queue`, `groupId`) => `void`

A consumer group was deleted from a queue.

Fires once per successful deletion. The deletion's preconditions
(no active consumers, empty pending queue) are enforced before the
event fires; a caller that receives this event can assume the group
is fully gone.

#### Parameters

##### queue

[`IQueueParams`](../interfaces/IQueueParams.md)

##### groupId

`string`

#### Returns

`void`

---

### queue.queueCreated

> **queue.queueCreated**: (`queue`, `properties`) => `void`

A queue was created.

Fires once per successful creation. A no-op call (the queue already
existed) does not fire the event; the corresponding
`QueueAlreadyExistsError` is the signal for a duplicate creation
attempt.

The payload carries the queue's initial properties. A subscriber
that needs the queue's current properties (which may have changed
since creation) reads them via `IQueueManager.getProperties`.

#### Parameters

##### queue

[`IQueueParams`](../interfaces/IQueueParams.md)

##### properties

[`IQueueProperties`](../interfaces/IQueueProperties.md)

#### Returns

`void`

---

### queue.queueDeleted

> **queue.queueDeleted**: (`queue`) => `void`

A queue was deleted.

Fires once per successful deletion. All of the queue's data
structures have been removed by the time this event fires.

#### Parameters

##### queue

[`IQueueParams`](../interfaces/IQueueParams.md)

#### Returns

`void`

---

### queue.stateChanged

> **queue.stateChanged**: (`queue`, `transition`) => `void`

A queue's operational state changed.

Fires whenever the queue moves between `ACTIVE`, `PAUSED`,
`STOPPED`, and `LOCKED`. The payload carries the full transition
record — the previous state, the new state, the reason, the
timestamp, and any lock metadata.

This is the same event the library uses internally for its own
coordination (the consumer's `QueueStateChangeHandler` subscribes
to the internal copy). The public event is the same payload; a
subscriber to the public bus sees it alongside the internal
subscribers.

#### Parameters

##### queue

[`IQueueParams`](../interfaces/IQueueParams.md)

##### transition

[`IQueueStateTransition`](../interfaces/IQueueStateTransition.md)

#### Returns

`void`
