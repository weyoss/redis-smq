[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / TConsumerEvent

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

***

### consumer.error()

> **consumer.error**: (`err`, `consumerId`) => `void`

#### Parameters

##### err

`Error`

##### consumerId

`string`

#### Returns

`void`

***

### consumer.goingDown()

> **consumer.goingDown**: (`consumerId`) => `void`

#### Parameters

##### consumerId

`string`

#### Returns

`void`

***

### consumer.goingUp()

> **consumer.goingUp**: (`consumerId`) => `void`

#### Parameters

##### consumerId

`string`

#### Returns

`void`

***

### consumer.up()

> **consumer.up**: (`consumerId`) => `void`

#### Parameters

##### consumerId

`string`

#### Returns

`void`
