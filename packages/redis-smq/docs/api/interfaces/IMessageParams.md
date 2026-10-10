[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageParams

# Interface: IMessageParams\<TBody\>

The serializable form of a message.

This is what `MessageEnvelope.toJSON()` produces and what is stored in
the message hash's `MESSAGE` field. It captures the message's content
and configuration, but not its runtime state — timestamps, attempts,
and requeue counters are stored in separate hash fields.

`TBody` defaults to `unknown` because messages are opaque to the
library: any JSON-serializable payload can be set via
`ProducibleMessage.setBody()`. Callers who know the body's shape can
parameterize the type at the call site.

## Extended by

- [`IMessageTransferable`](IMessageTransferable.md)

## Type Parameters

### TBody

`TBody` = `unknown`

## Properties

### body

> **body**: `TBody`

The message payload. Any JSON-serializable value.

---

### consumerGroupId

> **consumerGroupId**: `string` \| `null`

Consumer group ID, or `null` for POINT_TO_POINT queues and for
PUB_SUB queues before the target group is resolved.

---

### consumeTimeout

> **consumeTimeout**: `number`

Maximum time in milliseconds a consumer is given to process the
message before it is unacknowledged with a timeout. Zero means no
timeout.

---

### createdAt

> **createdAt**: `number`

Milliseconds since the Unix epoch, at the moment the
`ProducibleMessage` instance was constructed.

Used together with `ttl` to determine whether the message has
expired.

---

### destinationQueue

> **destinationQueue**: [`IQueueParams`](IQueueParams.md)

The queue the message ended up in after routing. For direct-to-queue
publishes, the same as `queue`. For exchange publishes, the queue
selected by matching.

---

### exchange

> **exchange**: [`IExchangeParsedParams`](IExchangeParsedParams.md) \| `null`

The exchange the message was published to, or `null` if it was
published directly to a queue.

Retained on the message for diagnostics; the actual routing decision
is made at publish time. The exchange's `type` is included but not
needed after routing — a future major release could narrow this to
`IQueueParams` (name + namespace only), shrinking the serialized
message. The change would be breaking for persisted data.

---

### priority

> **priority**: `number` \| `null`

Priority level, or `null` for non-priority queues.

---

### queue

> **queue**: [`IQueueParams`](IQueueParams.md) \| `null`

The queue the message was published to, or `null` if it was
published to an exchange.

---

### retryDelay

> **retryDelay**: `number`

Delay in milliseconds before a failed message is retried.

---

### retryThreshold

> **retryThreshold**: `number`

Maximum number of processing attempts before the message is
dead-lettered. Zero means no limit.

---

### scheduledCron

> **scheduledCron**: `string` \| `null`

CRON expression for scheduled delivery, or `null`.

---

### scheduledDelay

> **scheduledDelay**: `number` \| `null`

Delay before initial delivery, in milliseconds, or `null`.

---

### scheduledRepeat

> **scheduledRepeat**: `number`

Number of times a scheduled message repeats after initial delivery.

---

### scheduledRepeatPeriod

> **scheduledRepeatPeriod**: `number` \| `null`

Repeat period for scheduled delivery, in milliseconds, or `null`.

---

### ttl

> **ttl**: `number`

Time-to-live in milliseconds. Zero means the message never expires.
