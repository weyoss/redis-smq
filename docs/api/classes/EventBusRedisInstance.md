[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EventBusRedisInstance

# Class: EventBusRedisInstance

## Hierarchy

- `EventEmitter`\<`Pick`\<`TRedisClientEvent`, ``"error"``\>\>

  ↳ **`EventBusRedisInstance`**

## Table of contents

### Constructors

- [constructor](EventBusRedisInstance.md#constructor)

### Methods

- [emit](EventBusRedisInstance.md#emit)
- [getInstance](EventBusRedisInstance.md#getinstance)
- [getSetInstance](EventBusRedisInstance.md#getsetinstance)
- [init](EventBusRedisInstance.md#init)
- [on](EventBusRedisInstance.md#on)
- [once](EventBusRedisInstance.md#once)
- [removeAllListeners](EventBusRedisInstance.md#removealllisteners)
- [removeListener](EventBusRedisInstance.md#removelistener)
- [shutdown](EventBusRedisInstance.md#shutdown)

## Constructors

### constructor

• **new EventBusRedisInstance**(): [`EventBusRedisInstance`](EventBusRedisInstance.md)

#### Returns

[`EventBusRedisInstance`](EventBusRedisInstance.md)

#### Inherited from

EventEmitter\<
  Pick\<TRedisClientEvent, 'error'\>
\>.constructor

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
| `...args` | `Parameters`\<`Pick`\<`TRedisClientEvent`, ``"error"``\>[`E`]\> |

#### Returns

`boolean`

#### Inherited from

EventEmitter.emit

___

### getInstance

▸ **getInstance**(): `Error` \| `IEventBus`\<[`TRedisSMQEvent`](../README.md#tredissmqevent)\>

#### Returns

`Error` \| `IEventBus`\<[`TRedisSMQEvent`](../README.md#tredissmqevent)\>

___

### getSetInstance

▸ **getSetInstance**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`IEventBus`\<[`TRedisSMQEvent`](../README.md#tredissmqevent)\>\> |

#### Returns

`void`

___

### init

▸ **init**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

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
| `listener` | `Pick`\<`TRedisClientEvent`, ``"error"``\>[`E`] |

#### Returns

`this`

#### Inherited from

EventEmitter.on

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
| `listener` | `Pick`\<`TRedisClientEvent`, ``"error"``\>[`E`] |

#### Returns

`this`

#### Inherited from

EventEmitter.once

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

EventEmitter.removeAllListeners

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
| `listener` | `Pick`\<`TRedisClientEvent`, ``"error"``\>[`E`] |

#### Returns

`this`

#### Inherited from

EventEmitter.removeListener

___

### shutdown

▸ **shutdown**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`
