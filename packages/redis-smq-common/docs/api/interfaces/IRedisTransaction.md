[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IRedisTransaction

# Interface: IRedisTransaction

## Methods

### del()

> **del**(`key`): `this`

#### Parameters

##### key

`string` | `string`[]

#### Returns

`this`

***

### exec()

> **exec**(`cb`): `void`

#### Parameters

##### cb

[`ICallback`](ICallback.md)\<`unknown`[]\>

#### Returns

`void`

***

### expire()

> **expire**(`key`, `secs`): `this`

#### Parameters

##### key

`string`

##### secs

`number`

#### Returns

`this`

***

### hdel()

> **hdel**(`key`, `field`): `this`

#### Parameters

##### key

`string`

##### field

`string` | `string`[]

#### Returns

`this`

***

### hincrby()

> **hincrby**(`key`, `field`, `by`): `this`

#### Parameters

##### key

`string`

##### field

`string`

##### by

`number`

#### Returns

`this`

***

### hset()

> **hset**(`key`, `field`, `value`): `this`

#### Parameters

##### key

`string`

##### field

`string`

##### value

`string` | `number`

#### Returns

`this`

***

### lpop()

> **lpop**(`key`): `this`

#### Parameters

##### key

`string`

#### Returns

`this`

***

### lpush()

> **lpush**(`key`, `element`): `this`

#### Parameters

##### key

`string`

##### element

`string`

#### Returns

`this`

***

### lrem()

> **lrem**(`key`, `count`, `element`): `this`

#### Parameters

##### key

`string`

##### count

`number`

##### element

`string`

#### Returns

`this`

***

### ltrim()

> **ltrim**(`key`, `start`, `stop`): `this`

#### Parameters

##### key

`string`

##### start

`number`

##### stop

`number`

#### Returns

`this`

***

### pexpire()

> **pexpire**(`key`, `millis`): `this`

#### Parameters

##### key

`string`

##### millis

`number`

#### Returns

`this`

***

### rpop()

> **rpop**(`key`): `this`

#### Parameters

##### key

`string`

#### Returns

`this`

***

### rpoplpush()

> **rpoplpush**(`source`, `destination`): `this`

#### Parameters

##### source

`string`

##### destination

`string`

#### Returns

`this`

***

### rpush()

> **rpush**(`key`, `element`): `this`

#### Parameters

##### key

`string`

##### element

`string`

#### Returns

`this`

***

### sadd()

> **sadd**(`key`, `element`): `this`

#### Parameters

##### key

`string`

##### element

`string`

#### Returns

`this`

***

### srem()

> **srem**(`key`, `element`): `this`

#### Parameters

##### key

`string`

##### element

`string` | `string`[]

#### Returns

`this`

***

### zadd()

> **zadd**(`key`, `score`, `element`): `this`

#### Parameters

##### key

`string`

##### score

`number`

##### element

`string`

#### Returns

`this`

***

### zrem()

> **zrem**(`key`, `element`): `this`

#### Parameters

##### key

`string`

##### element

`string` | `string`[]

#### Returns

`this`
