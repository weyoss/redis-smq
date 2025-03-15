[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IRedisTransaction

# Interface: IRedisTransaction

## Table of contents

### Methods

- [del](IRedisTransaction.md#del)
- [exec](IRedisTransaction.md#exec)
- [expire](IRedisTransaction.md#expire)
- [hdel](IRedisTransaction.md#hdel)
- [hincrby](IRedisTransaction.md#hincrby)
- [hset](IRedisTransaction.md#hset)
- [lpop](IRedisTransaction.md#lpop)
- [lpush](IRedisTransaction.md#lpush)
- [lrem](IRedisTransaction.md#lrem)
- [ltrim](IRedisTransaction.md#ltrim)
- [pexpire](IRedisTransaction.md#pexpire)
- [rpop](IRedisTransaction.md#rpop)
- [rpoplpush](IRedisTransaction.md#rpoplpush)
- [rpush](IRedisTransaction.md#rpush)
- [sadd](IRedisTransaction.md#sadd)
- [srem](IRedisTransaction.md#srem)
- [zadd](IRedisTransaction.md#zadd)
- [zrem](IRedisTransaction.md#zrem)

## Methods

### del

▸ **del**(`key`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` \| `string`[] |

#### Returns

`this`

___

### exec

▸ **exec**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](ICallback.md)\<`unknown`[]\> |

#### Returns

`void`

___

### expire

▸ **expire**(`key`, `secs`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `secs` | `number` |

#### Returns

`this`

___

### hdel

▸ **hdel**(`key`, `field`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `field` | `string` \| `string`[] |

#### Returns

`this`

___

### hincrby

▸ **hincrby**(`key`, `field`, `by`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `field` | `string` |
| `by` | `number` |

#### Returns

`this`

___

### hset

▸ **hset**(`key`, `field`, `value`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `field` | `string` |
| `value` | `string` \| `number` |

#### Returns

`this`

___

### lpop

▸ **lpop**(`key`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`this`

___

### lpush

▸ **lpush**(`key`, `element`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `element` | `string` |

#### Returns

`this`

___

### lrem

▸ **lrem**(`key`, `count`, `element`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `count` | `number` |
| `element` | `string` |

#### Returns

`this`

___

### ltrim

▸ **ltrim**(`key`, `start`, `stop`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `start` | `number` |
| `stop` | `number` |

#### Returns

`this`

___

### pexpire

▸ **pexpire**(`key`, `millis`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `millis` | `number` |

#### Returns

`this`

___

### rpop

▸ **rpop**(`key`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`this`

___

### rpoplpush

▸ **rpoplpush**(`source`, `destination`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `string` |
| `destination` | `string` |

#### Returns

`this`

___

### rpush

▸ **rpush**(`key`, `element`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `element` | `string` |

#### Returns

`this`

___

### sadd

▸ **sadd**(`key`, `element`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `element` | `string` |

#### Returns

`this`

___

### srem

▸ **srem**(`key`, `element`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `element` | `string` \| `string`[] |

#### Returns

`this`

___

### zadd

▸ **zadd**(`key`, `score`, `element`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `score` | `number` |
| `element` | `string` |

#### Returns

`this`

___

### zrem

▸ **zrem**(`key`, `element`): `this`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |
| `element` | `string` \| `string`[] |

#### Returns

`this`
