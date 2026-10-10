[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IQueueProperties

# Interface: IQueueProperties

Full property set for a queue, as stored in Redis and returned by
`IQueueManager.getProperties()`.

The message counters are maintained by the Lua scripts and are always
consistent with the underlying Redis structures. A counter reaching
zero means the corresponding structure is empty; the two never
disagree.

`rateLimit` and `lockId` are nullable — they are unset for most
queues. `lastStateChangeAt` is null only for queues created before the
state-tracking schema, which the current release backfills on first
write.

## Properties

### acknowledgedMessagesCount

> **acknowledgedMessagesCount**: `number`

---

### deadLetteredMessagesCount

> **deadLetteredMessagesCount**: `number`

---

### delayedMessagesCount

> **delayedMessagesCount**: `number`

---

### deliveryModel

> **deliveryModel**: [`EQueueDeliveryModel`](../enumerations/EQueueDeliveryModel.md)

---

### lastStateChangeAt

> **lastStateChangeAt**: `number` \| `null`

---

### lockId

> **lockId**: `string` \| `null`

---

### messagesCount

> **messagesCount**: `number`

---

### operationalState

> **operationalState**: [`EQueueOperationalState`](../enumerations/EQueueOperationalState.md)

---

### pendingMessagesCount

> **pendingMessagesCount**: `number`

---

### processingMessagesCount

> **processingMessagesCount**: `number`

---

### queueType

> **queueType**: [`EQueueType`](../enumerations/EQueueType.md)

---

### rateLimit

> **rateLimit**: [`IQueueRateLimit`](IQueueRateLimit.md) \| `null`

---

### requeuedMessagesCount

> **requeuedMessagesCount**: `number`

---

### scheduledMessagesCount

> **scheduledMessagesCount**: `number`
