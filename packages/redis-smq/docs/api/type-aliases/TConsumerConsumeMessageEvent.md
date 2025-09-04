[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / TConsumerConsumeMessageEvent

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

***

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

***

### consumer.consumeMessage.messageDeadLettered()

> **consumer.consumeMessage.messageDeadLettered**: (`messageId`, `queue`, `messageHandlerId`, `consumerId`, `deadLetterReason`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### messageHandlerId

`string`

##### consumerId

`string`

##### deadLetterReason

[`EMessageUnacknowledgementDeadLetterReason`](../enumerations/EMessageUnacknowledgementDeadLetterReason.md)

#### Returns

`void`

***

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

***

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

***

### consumer.consumeMessage.messageUnacknowledged()

> **consumer.consumeMessage.messageUnacknowledged**: (`messageId`, `queue`, `messageHandlerId`, `consumerId`, `unknowledgmentReason`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### messageHandlerId

`string`

##### consumerId

`string`

##### unknowledgmentReason

[`EMessageUnacknowledgementReason`](../enumerations/EMessageUnacknowledgementReason.md)

#### Returns

`void`
