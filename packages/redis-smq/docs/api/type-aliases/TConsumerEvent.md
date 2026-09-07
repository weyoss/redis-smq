[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TConsumerEvent

# Type Alias: TConsumerEvent

> **TConsumerEvent** = `object`

## Properties

### consumer.down()

> **consumer.down**: (`consumerId`) => `void`

#### Parameters

##### consumerId

`string`

#### Returns

`void`

---

### consumer.goingDown()

> **consumer.goingDown**: (`consumerId`) => `void`

#### Parameters

##### consumerId

`string`

#### Returns

`void`

---

### consumer.goingUp()

> **consumer.goingUp**: (`consumerId`) => `void`

#### Parameters

##### consumerId

`string`

#### Returns

`void`

---

### consumer.messageAcknowledged()

> **consumer.messageAcknowledged**: (`messageId`, `queue`, `consumerId`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### consumerId

`string`

#### Returns

`void`

---

### consumer.messageDeadLettered()

> **consumer.messageDeadLettered**: (`messageId`, `queue`, `consumerId`, `deadLetterCause`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### consumerId

`string`

##### deadLetterCause

[`EMessageDeadLetterCause`](../enumerations/EMessageDeadLetterCause.md)

#### Returns

`void`

---

### consumer.messageDelayed()

> **consumer.messageDelayed**: (`messageId`, `queue`, `consumerId`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### consumerId

`string`

#### Returns

`void`

---

### consumer.messageReceived()

> **consumer.messageReceived**: (`messageId`, `queue`, `consumerId`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### consumerId

`string`

#### Returns

`void`

---

### consumer.messageRequeued()

> **consumer.messageRequeued**: (`messageId`, `queue`, `consumerId`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### consumerId

`string`

#### Returns

`void`

---

### consumer.messageUnacknowledged()

> **consumer.messageUnacknowledged**: (`messageId`, `queue`, `consumerId`, `unacknowledgmentCause`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### consumerId

`string`

##### unacknowledgmentCause

[`EMessageUnacknowledgementCause`](../enumerations/EMessageUnacknowledgementCause.md)

#### Returns

`void`

---

### consumer.up()

> **consumer.up**: (`consumerId`) => `void`

#### Parameters

##### consumerId

`string`

#### Returns

`void`
