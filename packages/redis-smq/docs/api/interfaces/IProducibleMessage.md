[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / IProducibleMessage

# Interface: IProducibleMessage

A fluent builder that describes a message to be published.

Every configuration method returns the same instance, so calls can be
chained. The builder is not itself a message — it becomes one when
handed to `IProducer.produce()`, at which point the producer wraps it
in a `MessageEnvelope` and assigns a destination.

A `ProducibleMessage` starts with defaults for TTL, retry policy, and
consume timeout. Those defaults are process-wide, configurable via the
static `setDefaultConsumeOptions` on the concrete class. Per-instance
overrides are made through the corresponding `set*` methods.

Destination is set exactly one way:

- `setQueue(queue)` for direct-to-queue publishing, or
- one of `setDirectExchange`, `setTopicExchange`, `setFanoutExchange`
  for exchange publishing (optionally followed by
  `setExchangeRoutingKey` for direct and topic exchanges).

Setting a queue clears any previously set exchange, and vice versa. A
message with neither a queue nor an exchange is rejected by
`IProducer.produce()`.

## Example

```ts
// Direct to a queue
const msg = new ProducibleMessage()
  .setQueue('orders')
  .setBody({ orderId: 123 })
  .setTTL(60_000);

// Through a topic exchange
const msg2 = new ProducibleMessage()
  .setTopicExchange('events')
  .setExchangeRoutingKey('order.created')
  .setBody({ orderId: 456 });
```

## Methods

### disablePriority()

> **disablePriority**(): `IProducibleMessage`

Clears the priority.

#### Returns

`IProducibleMessage`

---

### getBody()

> **getBody**(): `unknown`

Returns the message payload.

#### Returns

`unknown`

---

### getConsumeTimeout()

> **getConsumeTimeout**(): `number`

Returns the configured consume timeout in milliseconds.

#### Returns

`number`

---

### getCreatedAt()

> **getCreatedAt**(): `number`

Returns the timestamp at which this builder was constructed.

The value is set in the constructor and never changes. It is used
together with the TTL to determine whether the message has expired.

#### Returns

`number`

---

### getExchange()

> **getExchange**(): [`IExchangeParsedParams`](IExchangeParsedParams.md) \| `null`

Returns the configured exchange, or `null` if the message is
destined for a queue (or has no destination yet).

#### Returns

[`IExchangeParsedParams`](IExchangeParsedParams.md) \| `null`

---

### getExchangeRoutingKey()

> **getExchangeRoutingKey**(): `string` \| `null`

Returns the configured routing key, or `null` if none was set.

#### Returns

`string` \| `null`

---

### getPriority()

> **getPriority**(): [`EMessagePriority`](../enumerations/EMessagePriority.md) \| `null`

Returns the configured priority, or `null` if none was set.

#### Returns

[`EMessagePriority`](../enumerations/EMessagePriority.md) \| `null`

---

### getQueue()

> **getQueue**(): [`IQueueParams`](IQueueParams.md) \| `null`

Returns the configured target queue, or `null` if the message is
destined for an exchange (or has no destination yet).

#### Returns

[`IQueueParams`](IQueueParams.md) \| `null`

---

### getRetryDelay()

> **getRetryDelay**(): `number`

Returns the configured retry delay in milliseconds.

#### Returns

`number`

---

### getRetryThreshold()

> **getRetryThreshold**(): `number`

Returns the configured retry threshold.

#### Returns

`number`

---

### getScheduledCRON()

> **getScheduledCRON**(): `string` \| `null`

Returns the configured CRON expression, or `null`.

#### Returns

`string` \| `null`

---

### getScheduledDelay()

> **getScheduledDelay**(): `number` \| `null`

Returns the configured initial delay, or `null`.

#### Returns

`number` \| `null`

---

### getScheduledRepeat()

> **getScheduledRepeat**(): `number`

Returns the configured repeat count.

#### Returns

`number`

---

### getScheduledRepeatPeriod()

> **getScheduledRepeatPeriod**(): `number` \| `null`

Returns the configured repeat period, or `null`.

#### Returns

`number` \| `null`

---

### getTTL()

> **getTTL**(): `number`

Returns the configured TTL in milliseconds. `0` means no expiry.

#### Returns

`number`

---

### hasPriority()

> **hasPriority**(): `boolean`

Returns `true` if a priority has been set.

#### Returns

`boolean`

---

### resetScheduledParams()

> **resetScheduledParams**(): `IProducibleMessage`

Resets every scheduling parameter — CRON, delay, repeat period, and
repeat count — to its default (unset).

#### Returns

`IProducibleMessage`

---

### setBody()

> **setBody**(`body`): `IProducibleMessage`

Sets the message payload. Any JSON-serializable value is accepted.

The library does not validate or transform the payload; it is
serialized to JSON, stored on the message hash, and returned
unchanged to consumers.

#### Parameters

##### body

`unknown`

#### Returns

`IProducibleMessage`

---

### setConsumeTimeout()

> **setConsumeTimeout**(`timeout`): `IProducibleMessage`

Sets the maximum time a consumer is given to process this message,
in milliseconds.

A value of `0` means no timeout. When a consumer exceeds the
timeout, the message is unacknowledged with cause `TIMEOUT` and
requeued or delayed according to its retry policy.

#### Parameters

##### timeout

`number`

#### Returns

`IProducibleMessage`

#### Throws

MessagePropertyInvalidValueError if the value is not a
non-negative number.

---

### setDirectExchange()

> **setDirectExchange**(`exchange`): `IProducibleMessage`

Sets a direct exchange as the destination.

Clears any previously configured queue, exchange, and routing key.
A routing key must be supplied via `setExchangeRoutingKey()` before
the message is produced; producing without one fails with
`RoutingKeyRequiredError`.

#### Parameters

##### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

#### Returns

`IProducibleMessage`

---

### setExchangeRoutingKey()

> **setExchangeRoutingKey**(`routingKey`): `IProducibleMessage`

Sets the routing key for exchange-based delivery.

#### Parameters

##### routingKey

`string`

#### Returns

`IProducibleMessage`

#### Throws

ExchangeRequiredError if no exchange has been set yet.

---

### setFanoutExchange()

> **setFanoutExchange**(`exchange`): `IProducibleMessage`

Sets a fanout exchange as the destination.

Clears any previously configured queue, exchange, and routing key.
Fanout exchanges ignore routing keys — every bound queue receives a
copy of the message.

#### Parameters

##### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

#### Returns

`IProducibleMessage`

---

### setPriority()

> **setPriority**(`priority`): `IProducibleMessage`

Sets the priority level.

Only meaningful for PRIORITY_QUEUE queues. Setting a priority on a
message destined for a FIFO or LIFO queue causes production to fail
with `PriorityQueuingNotEnabledError`; producing without a priority
to a priority queue fails with `MessagePriorityRequiredError`.

#### Parameters

##### priority

[`EMessagePriority`](../enumerations/EMessagePriority.md)

#### Returns

`IProducibleMessage`

---

### setQueue()

> **setQueue**(`queue`): `IProducibleMessage`

Sets the target queue.

Clears any previously configured exchange and routing key. The queue
may be a bare name (resolved against the configured default
namespace) or `{ name, ns }`.

#### Parameters

##### queue

`string` \| [`IQueueParams`](IQueueParams.md)

#### Returns

`IProducibleMessage`

#### Throws

InvalidQueueParametersError if the name or namespace is
empty or contains characters not allowed in a Redis key.

---

### setRetryDelay()

> **setRetryDelay**(`delay`): `IProducibleMessage`

Sets the delay between processing attempts when a message fails, in
milliseconds.

A value of `0` causes failed messages to be requeued immediately; a
positive value places them in the delayed set for the configured
interval before retrying.

#### Parameters

##### delay

`number`

#### Returns

`IProducibleMessage`

#### Throws

MessagePropertyInvalidValueError if the value is not a
non-negative number.

---

### setRetryThreshold()

> **setRetryThreshold**(`threshold`): `IProducibleMessage`

Sets the maximum number of processing attempts before this message
is dead-lettered.

#### Parameters

##### threshold

`number`

#### Returns

`IProducibleMessage`

#### Throws

MessagePropertyInvalidValueError if the value is not a
non-negative number.

---

### setScheduledCRON()

> **setScheduledCRON**(`cron`): `IProducibleMessage`

Sets a CRON expression for scheduled delivery.

Accepts both 5-field (standard Unix) and 6-field (with seconds)
expressions. A 5-field expression is treated as if it had a leading
`0` seconds field.

#### Parameters

##### cron

`string`

#### Returns

`IProducibleMessage`

#### Throws

InvalidCronExpressionError if the expression is empty, has
an unsupported field count, or does not parse.

---

### setScheduledDelay()

> **setScheduledDelay**(`delay`): `IProducibleMessage`

Sets a delay before the message's first delivery, in milliseconds.

Mutually exclusive in effect with CRON scheduling: a message with a
delay is delivered once, at `now + delay`.

#### Parameters

##### delay

`number`

#### Returns

`IProducibleMessage`

#### Throws

MessagePropertyInvalidValueError if the value is not a
non-negative number.

---

### setScheduledRepeat()

> **setScheduledRepeat**(`repeat`): `IProducibleMessage`

Sets the number of times a scheduled message repeats after its
initial delivery.

#### Parameters

##### repeat

`number`

#### Returns

`IProducibleMessage`

#### Throws

MessagePropertyInvalidValueError if the value is not a
non-negative number.

---

### setScheduledRepeatPeriod()

> **setScheduledRepeatPeriod**(`period`): `IProducibleMessage`

Sets the repeat period for scheduled delivery, in milliseconds.

Applies only when `setScheduledRepeat(n)` has been called with
`n > 0`. For a message with both CRON and repeat configured, the
CRON expression acts as a trigger — each CRON tick begins a new
repeat cycle.

#### Parameters

##### period

`number`

#### Returns

`IProducibleMessage`

#### Throws

MessagePropertyInvalidValueError if the value is not a
non-negative number.

---

### setTopicExchange()

> **setTopicExchange**(`exchange`): `IProducibleMessage`

Sets a topic exchange as the destination.

Clears any previously configured queue, exchange, and routing key.
A routing key must be supplied via `setExchangeRoutingKey()` before
the message is produced; producing without one fails with
`RoutingKeyRequiredError`.

#### Parameters

##### exchange

`string` \| [`IExchangeParams`](IExchangeParams.md)

#### Returns

`IProducibleMessage`

---

### setTTL()

> **setTTL**(`ttl`): `IProducibleMessage`

Sets the Time-To-Live for this message, in milliseconds.

A value of `0` means the message never expires. TTL is evaluated by
the consumer at checkout: if `createdAt + ttl` is in the past, the
message is unacknowledged with cause `TTL_EXPIRED` and moved to the
dead-letter list.

#### Parameters

##### ttl

`number`

#### Returns

`IProducibleMessage`

#### Throws

MessagePropertyInvalidValueError if the value is not a
non-negative number.
