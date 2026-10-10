[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IMessageTransferable

# Interface: IMessageTransferable\<TBody\>

A message together with its runtime state, as returned by message
browsers and `MessageManager`.

Extends `IMessageParams` with the message's ID, its full state (all
timestamps, attempts, and counters), and its current status.

The `messageState` field carries the transferable form of the state.
Users who need to inspect a specific timestamp (e.g.,
`deadLetteredAt`) or counter (e.g., `attempts`) read it from
`messageState`, not from the top level.

## Extends

- [`IMessageParams`](IMessageParams.md)\<`TBody`\>

## Type Parameters

### TBody

`TBody` = `unknown`

## Properties

### body

> **body**: `TBody`

The message payload. Any JSON-serializable value.

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`body`](IMessageParams.md#body)

---

### consumerGroupId

> **consumerGroupId**: `string` \| `null`

Consumer group ID, or `null` for POINT_TO_POINT queues and for
PUB_SUB queues before the target group is resolved.

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`consumerGroupId`](IMessageParams.md#consumergroupid)

---

### consumeTimeout

> **consumeTimeout**: `number`

Maximum time in milliseconds a consumer is given to process the
message before it is unacknowledged with a timeout. Zero means no
timeout.

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`consumeTimeout`](IMessageParams.md#consumetimeout)

---

### createdAt

> **createdAt**: `number`

Milliseconds since the Unix epoch, at the moment the
`ProducibleMessage` instance was constructed.

Used together with `ttl` to determine whether the message has
expired.

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`createdAt`](IMessageParams.md#createdat)

---

### destinationQueue

> **destinationQueue**: [`IQueueParams`](IQueueParams.md)

The queue the message ended up in after routing. For direct-to-queue
publishes, the same as `queue`. For exchange publishes, the queue
selected by matching.

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`destinationQueue`](IMessageParams.md#destinationqueue)

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

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`exchange`](IMessageParams.md#exchange)

---

### id

> **id**: `string`

Unique message ID.

---

### messageState

> **messageState**: [`IMessageStateTransferable`](IMessageStateTransferable.md)

Full runtime state — timestamps, attempts, counters.

---

### priority

> **priority**: `number` \| `null`

Priority level, or `null` for non-priority queues.

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`priority`](IMessageParams.md#priority)

---

### queue

> **queue**: [`IQueueParams`](IQueueParams.md) \| `null`

The queue the message was published to, or `null` if it was
published to an exchange.

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`queue`](IMessageParams.md#queue)

---

### retryDelay

> **retryDelay**: `number`

Delay in milliseconds before a failed message is retried.

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`retryDelay`](IMessageParams.md#retrydelay)

---

### retryThreshold

> **retryThreshold**: `number`

Maximum number of processing attempts before the message is
dead-lettered. Zero means no limit.

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`retryThreshold`](IMessageParams.md#retrythreshold)

---

### scheduledCron

> **scheduledCron**: `string` \| `null`

CRON expression for scheduled delivery, or `null`.

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`scheduledCron`](IMessageParams.md#scheduledcron)

---

### scheduledDelay

> **scheduledDelay**: `number` \| `null`

Delay before initial delivery, in milliseconds, or `null`.

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`scheduledDelay`](IMessageParams.md#scheduleddelay)

---

### scheduledRepeat

> **scheduledRepeat**: `number`

Number of times a scheduled message repeats after initial delivery.

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`scheduledRepeat`](IMessageParams.md#scheduledrepeat)

---

### scheduledRepeatPeriod

> **scheduledRepeatPeriod**: `number` \| `null`

Repeat period for scheduled delivery, in milliseconds, or `null`.

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`scheduledRepeatPeriod`](IMessageParams.md#scheduledrepeatperiod)

---

### status

> **status**: [`EMessagePropertyStatus`](../enumerations/EMessagePropertyStatus.md)

Current status of the message.

---

### ttl

> **ttl**: `number`

Time-to-live in milliseconds. Zero means the message never expires.

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`ttl`](IMessageParams.md#ttl)
