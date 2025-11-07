[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / TRedisClientEvent

# Type Alias: TRedisClientEvent

> **TRedisClientEvent** = `object`

## Properties

### end()

> **end**: () => `void`

#### Returns

`void`

***

### error()

> **error**: (`err`) => `void`

#### Parameters

##### err

`Error`

#### Returns

`void`

***

### message()

> **message**: (`channel`, `message`) => `void`

#### Parameters

##### channel

`string`

##### message

`string`

#### Returns

`void`

***

### pmessage()

> **pmessage**: (`pattern`, `channel`, `message`) => `void`

#### Parameters

##### pattern

`string`

##### channel

`string`

##### message

`string`

#### Returns

`void`

***

### ready()

> **ready**: () => `void`

#### Returns

`void`
