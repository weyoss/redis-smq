[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IQueuePublishedMessagesCountByStatus

# Interface: IQueuePublishedMessagesCountByStatus

Message counts by status for a queue.

## Properties

### acknowledged

> **acknowledged**: `number`

Number of acknowledged messages (also known as "consumed").

---

### deadLettered

> **deadLettered**: `number`

Number of dead-lettered messages.

---

### pending

> **pending**: `number`

Number of pending messages.

---

### scheduled

> **scheduled**: `number`

Number of scheduled messages.
