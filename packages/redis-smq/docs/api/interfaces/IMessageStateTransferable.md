[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageStateTransferable

# Interface: IMessageStateTransferable

The transferable form of a message's runtime state.

This is what `MessageState.toJSON()` produces, what
`IMessageTransferable.messageState` carries, and what the message
browser returns alongside each message. Every field describes a
moment in the message's lifecycle or a counter accumulated over it.

Nullable timestamp fields are `null` until the corresponding event
occurs. For example, `acknowledgedAt` is `null` until the message is
acknowledged; `deadLetteredAt` is `null` unless it has been
dead-lettered.

The `uuid` field is the message ID. It is named `uuid` here rather
than `id` because it is the state's identifier, produced by the state
object itself, not assigned by the message envelope. In every
user-facing context they are the same string.

## Properties

### acknowledgedAt

> **acknowledgedAt**: `number` \| `null`

Timestamp when the message was acknowledged.

---

### attempts

> **attempts**: `number`

Number of processing attempts made so far.

Incremented by the checkout script when a message is claimed by a
consumer. Compared against `ProducibleMessage.retryThreshold` to
decide whether the message should be dead-lettered on the next
failure.

---

### deadLetteredAt

> **deadLetteredAt**: `number` \| `null`

Timestamp when the message was dead-lettered.

---

### effectiveScheduledDelay

> **effectiveScheduledDelay**: `number`

The delay in milliseconds currently scheduled for the message's next
delivery.

Used for a scheduled message whose initial delay has been set via
`ProducibleMessage.setScheduledDelay()`. Reset to zero once the
delay has been consumed.

---

### expired

> **expired**: `boolean`

True once the message's TTL has elapsed relative to its creation
time.

Set at checkout time by the consumer, which compares
`createdAt + ttl` against the current time. An expired message is
unacknowledged with cause `TTL_EXPIRED` and moved to the
dead-letter list.

---

### lastProcessedAt

> **lastProcessedAt**: `number` \| `null`

Timestamp of the last completed processing attempt.

---

### lastRequeuedAt

> **lastRequeuedAt**: `number` \| `null`

Timestamp of the last requeue.

---

### lastRetriedAttemptAt

> **lastRetriedAttemptAt**: `number` \| `null`

Timestamp of the last automatic retry attempt.

---

### lastScheduledAt

> **lastScheduledAt**: `number` \| `null`

Timestamp of the last scheduling.

---

### lastUnacknowledgedAt

> **lastUnacknowledgedAt**: `number` \| `null`

Timestamp of the last unacknowledgement.

---

### processingStartedAt

> **processingStartedAt**: `number` \| `null`

Timestamp when message processing started.

---

### publishedAt

> **publishedAt**: `number` \| `null`

Timestamp when the message was first published.

---

### requeueCount

> **requeueCount**: `number`

Number of times the message has been manually requeued.

Incremented when a user calls `MessageManager.requeueMessageById()`
on the message. Does not count automatic retries — those are tracked
by `attempts` and `lastRetriedAttemptAt`.

---

### requeuedAt

> **requeuedAt**: `number` \| `null`

Timestamp when the message was manually requeued.

---

### requeuedMessageParentId

> **requeuedMessageParentId**: `string` \| `null`

The ID of the message this message was requeued from, or null.

Set when a message is manually requeued: a new message is created
and this field points at the original. The original stays where it
was (in the acknowledged or dead-lettered list), its requeue
counters updated to reflect the clone.

---

### scheduledAt

> **scheduledAt**: `number` \| `null`

Timestamp when the message was scheduled for delivery.

---

### scheduledCronFired

> **scheduledCronFired**: `boolean`

True once the CRON expression of a scheduled message has fired.

Used by the scheduling logic to distinguish "this message has never
been delivered" from "this message has been delivered at least
once", which affects how the next delivery time is computed for a
message with both CRON and repeat configured.

---

### scheduledMessageParentId

> **scheduledMessageParentId**: `string` \| `null`

The ID of the original scheduled message this message was created
from, or null.

When a repeating scheduled message is delivered, a _new_ message is
created for each firing. The new message carries the original's ID
in this field, so the two can be correlated. The original remains in
the scheduled set for its next firing.

---

### scheduledRepeatCount

> **scheduledRepeatCount**: `number`

Number of times the message has been scheduled and delivered as part
of a repeat cycle.

Only meaningful for messages with `scheduledRepeat > 0`. Reset to
zero when a CRON tick fires (a CRON tick begins a new repeat cycle).

---

### scheduledTimes

> **scheduledTimes**: `number`

Number of times the message has been scheduled and delivered.

Incremented on every scheduling event, regardless of the trigger
(initial delay, CRON tick, or repeat cycle). A lifetime counter, not
reset between repeat cycles.

---

### unacknowledgedAt

> **unacknowledgedAt**: `number` \| `null`

Timestamp when the message was unacknowledged.

---

### uuid

> **uuid**: `string`

The message ID. Same string as `IMessageTransferable.id`.
