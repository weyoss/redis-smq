[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / TProducerEvent

# Type Alias: TProducerEvent

> **TProducerEvent** = `object`

## Properties

### producer.down()

> **producer.down**: (`producerId`) => `void`

#### Parameters

##### producerId

`string`

#### Returns

`void`

***

### producer.error()

> **producer.error**: (`err`, `producerId`) => `void`

#### Parameters

##### err

`Error`

##### producerId

`string`

#### Returns

`void`

***

### producer.goingDown()

> **producer.goingDown**: (`producerId`) => `void`

#### Parameters

##### producerId

`string`

#### Returns

`void`

***

### producer.goingUp()

> **producer.goingUp**: (`producerId`) => `void`

#### Parameters

##### producerId

`string`

#### Returns

`void`

***

### producer.messagePublished()

> **producer.messagePublished**: (`messageId`, `queue`, `producerId`) => `void`

#### Parameters

##### messageId

`string`

##### queue

[`IQueueParsedParams`](../interfaces/IQueueParsedParams.md)

##### producerId

`string`

#### Returns

`void`

***

### producer.up()

> **producer.up**: (`producerId`) => `void`

#### Parameters

##### producerId

`string`

#### Returns

`void`
