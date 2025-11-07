[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / TConsumerDequeueMessageEvent

# Type Alias: TConsumerDequeueMessageEvent

> **TConsumerDequeueMessageEvent** = `object`

## Properties

### consumer.dequeueMessage.error()

> **consumer.dequeueMessage.error**: (`err`, `consumerId`, `queue`) => `void`

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

### consumer.dequeueMessage.messageReceived()

> **consumer.dequeueMessage.messageReceived**: (`messageId`, `queue`, `consumerId`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### consumerId

`string`

#### Returns

`void`

***

### consumer.dequeueMessage.nextMessage()

> **consumer.dequeueMessage.nextMessage**: () => `void`

#### Returns

`void`
