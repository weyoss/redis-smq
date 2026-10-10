[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageUnacknowledgementRecord

# Interface: IMessageUnacknowledgementRecord

One entry in a message's unacknowledgement history.

An unacknowledgement history is a per-message log of the reasons a
message failed to be processed successfully. Each entry records the
cause, the resolution action the library took, and enough context to
correlate the entry with the consumer and the queue that produced it.

The history is attached to the message's own Redis hash — it is not a
queue-level list. A message's history survives alongside the message
itself and is deleted when the message is deleted. It is populated
only when the `unacknowledgementHistory` audit is enabled in the
configuration (see `IMessageAuditHistoryConfig`).

Records are stored as JSON in a Redis list. The list is built with
`LPUSH`, so it is ordered newest first when read.

## See

- IMessageManager.getMessageUnacknowledgementHistory
- IMessageAuditHistoryConfig

## Properties

### action

> **action**: [`EMessageUnacknowledgementAction`](../enumerations/EMessageUnacknowledgementAction.md)

What the library did with the message as a result of the
unacknowledgement.

The action is the outcome, not the intent: a message with cause
`TIMEOUT` may resolve to `REQUEUE`, `DELAY`, or `DEAD_LETTER`
depending on the message's retry policy and prior attempts. The
action recorded here is the one that was actually taken.

#### See

EMessageUnacknowledgementAction

---

### cause

> **cause**: [`EMessageUnacknowledgementCause`](../enumerations/EMessageUnacknowledgementCause.md)

Why the message was unacknowledged.

The cause categorizes the trigger: a handler failure, a queue-state
change, an infrastructure event, or a message-level policy (TTL
expiry, retry threshold).

#### See

EMessageUnacknowledgementCause

---

### consumerId

> **consumerId**: `string`

The ID of the consumer that was processing the message when it was
unacknowledged.

For unacknowledgements triggered by the reaper (offline consumer
recovery), this is the ID of the consumer that had registered for
the message and then stopped heartbeating.

---

### deadLetterCause?

> `optional` **deadLetterCause?**: [`EMessageDeadLetterCause`](../enumerations/EMessageDeadLetterCause.md)

The specific dead-letter reason, present only when `action` is
`DEAD_LETTER`.

Distinguishes between the three ways a message reaches the
dead-letter list: TTL expiry, retry threshold exhaustion, or
periodic-message termination. Absent for every other action.

#### See

EMessageDeadLetterCause

---

### messageId

> **messageId**: `string`

The message ID this record describes.

Redundant with the enclosing message's ID — the history is stored
on the message's own hash — but useful when a record is serialized
or passed outside the message context.

---

### queue

> **queue**: [`IQueueParsedParams`](IQueueParsedParams.md)

The queue the message was on when it was unacknowledged.

Carries the effective consumer group ID for PUB/SUB queues. A
message published to a PUB/SUB queue with multiple consumer groups
has one history per (queue, group) pair only if the message was
fanned out as separate envelopes — each envelope has its own ID and
its own history. A single envelope's history always carries the
same `queue` value.

---

### retryCount

> **retryCount**: `number`

The message's attempt count at the moment of unacknowledgement.

This is the value of `IMessageStateTransferable.attempts` when the
record was written. A record with `retryCount: 3` describes the
third unacknowledgement of the message.

Named `retryCount` for continuity with the field name used in the
source and in serialized history. It is not the same as
`IMessageStateTransferable.requeueCount`, which counts _manual_
requeues only.

---

### timestamp

> **timestamp**: `number`

Milliseconds since the Unix epoch, at the moment the
unacknowledgement occurred.
