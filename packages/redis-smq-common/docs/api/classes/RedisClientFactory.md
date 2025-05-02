[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / RedisClientFactory

# Class: RedisClientFactory

## Hierarchy

- [`EventEmitter`](EventEmitter.md)\<`Pick`\<[`TRedisClientEvent`](../README.md#tredisclientevent), ``"error"``\>\>

  ↳ **`RedisClientFactory`**

## Table of contents

### Constructors

- [constructor](RedisClientFactory.md#constructor)

### Methods

- [emit](RedisClientFactory.md#emit)
- [getInstance](RedisClientFactory.md#getinstance)
- [getSetInstance](RedisClientFactory.md#getsetinstance)
- [init](RedisClientFactory.md#init)
- [on](RedisClientFactory.md#on)
- [once](RedisClientFactory.md#once)
- [removeAllListeners](RedisClientFactory.md#removealllisteners)
- [removeListener](RedisClientFactory.md#removelistener)
- [shutdown](RedisClientFactory.md#shutdown)

## Constructors

### constructor

• **new RedisClientFactory**(`config`): [`RedisClientFactory`](RedisClientFactory.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IRedisConfig`](../interfaces/IRedisConfig.md) |

#### Returns

[`RedisClientFactory`](RedisClientFactory.md)

#### Overrides

[EventEmitter](EventEmitter.md).[constructor](EventEmitter.md#constructor)

## Methods

### emit

▸ **emit**\<`E`\>(`event`, `...args`): `boolean`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends ``"error"`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `...args` | `Parameters`\<`Pick`\<[`TRedisClientEvent`](../README.md#tredisclientevent), ``"error"``\>[`E`]\> |

#### Returns

`boolean`

#### Inherited from

[EventEmitter](EventEmitter.md).[emit](EventEmitter.md#emit)

___

### getInstance

▸ **getInstance**(): `Error` \| [`IRedisClient`](../interfaces/IRedisClient.md)

#### Returns

`Error` \| [`IRedisClient`](../interfaces/IRedisClient.md)

___

### getSetInstance

▸ **getSetInstance**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<[`IRedisClient`](../interfaces/IRedisClient.md)\> |

#### Returns

`void`

___

### init

▸ **init**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<`void`\> |

#### Returns

`void`

___

### on

▸ **on**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends ``"error"`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | `Pick`\<[`TRedisClientEvent`](../README.md#tredisclientevent), ``"error"``\>[`E`] |

#### Returns

`this`

#### Inherited from

[EventEmitter](EventEmitter.md).[on](EventEmitter.md#on)

___

### once

▸ **once**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends ``"error"`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | `Pick`\<[`TRedisClientEvent`](../README.md#tredisclientevent), ``"error"``\>[`E`] |

#### Returns

`this`

#### Inherited from

[EventEmitter](EventEmitter.md).[once](EventEmitter.md#once)

___

### removeAllListeners

▸ **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends ``"error"`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `Extract`\<`E`, `string`\> |

#### Returns

`this`

#### Inherited from

[EventEmitter](EventEmitter.md).[removeAllListeners](EventEmitter.md#removealllisteners)

___

### removeListener

▸ **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends ``"error"`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | `Pick`\<[`TRedisClientEvent`](../README.md#tredisclientevent), ``"error"``\>[`E`] |

#### Returns

`this`

#### Inherited from

[EventEmitter](EventEmitter.md).[removeListener](EventEmitter.md#removelistener)

___

### shutdown

▸ **shutdown**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<`void`\> |

#### Returns

`void`
