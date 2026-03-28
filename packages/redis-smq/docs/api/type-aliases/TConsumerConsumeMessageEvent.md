[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TConsumerConsumeMessageEvent

# Type Alias: TConsumerConsumeMessageEvent

> **TConsumerConsumeMessageEvent** = `object`

## Properties

### consumer.consumeMessage.error()

> **consumer.consumeMessage.error**: (`err`, `consumerId`, `queue`) => `void`

#### Parameters

##### err

`Error`

##### consumerId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

#### Returns

`void`

---

### consumer.consumeMessage.messageAcknowledged()

> **consumer.consumeMessage.messageAcknowledged**: (`messageId`, `queue`, `messageHandlerId`, `consumerId`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### messageHandlerId

`string`

##### consumerId

`string`

#### Returns

`void`

---

### consumer.consumeMessage.messageDeadLettered()

> **consumer.consumeMessage.messageDeadLettered**: (`messageId`, `queue`, `messageHandlerId`, `consumerId`, `deadLetterCause`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### messageHandlerId

`string`

##### consumerId

`string`

##### deadLetterCause

[`EMessageDeadLetterCause`](../enumerations/EMessageDeadLetterCause.md)

#### Returns

`void`

---

### consumer.consumeMessage.messageDelayed()

> **consumer.consumeMessage.messageDelayed**: (`messageId`, `queue`, `messageHandlerId`, `consumerId`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### messageHandlerId

`string`

##### consumerId

`string`

#### Returns

`void`

---

### consumer.consumeMessage.messageRequeued()

> **consumer.consumeMessage.messageRequeued**: (`messageId`, `queue`, `messageHandlerId`, `consumerId`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### messageHandlerId

`string`

##### consumerId

`string`

#### Returns

`void`

---

### consumer.consumeMessage.messageUnacknowledged()

> **consumer.consumeMessage.messageUnacknowledged**: (`messageId`, `queue`, `messageHandlerId`, `consumerId`, `unacknowledgmentCause`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### messageHandlerId

`string`

##### consumerId

`string`

##### unacknowledgmentCause

[`EMessageUnacknowledgementCause`](../enumerations/EMessageUnacknowledgementCause.md)

#### Returns

`void`

---

### consumer.consumeMessage.next()

> **consumer.consumeMessage.next**: () => `void`

#### Returns

`void`
