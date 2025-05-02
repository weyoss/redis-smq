[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EventBus

# Class: EventBus

## Hierarchy

- `EventBusRedisFactory`\<[`TRedisSMQEvent`](../README.md#tredissmqevent)\>

  ↳ **`EventBus`**

## Table of contents

### Constructors

- [constructor](EventBus.md#constructor)

### Properties

- [init](EventBus.md#init)
- [shutdown](EventBus.md#shutdown)

### Methods

- [emit](EventBus.md#emit)
- [getInstance](EventBus.md#getinstance)
- [getSetInstance](EventBus.md#getsetinstance)
- [on](EventBus.md#on)
- [once](EventBus.md#once)
- [removeAllListeners](EventBus.md#removealllisteners)
- [removeListener](EventBus.md#removelistener)

## Constructors

### constructor

• **new EventBus**(): [`EventBus`](EventBus.md)

#### Returns

[`EventBus`](EventBus.md)

#### Overrides

EventBusRedisFactory\<TRedisSMQEvent\>.constructor

## Properties

### init

• **init**: (`cb`: `ICallback`\<`void`\>) => `void`

#### Type declaration

▸ (`cb`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

##### Returns

`void`

#### Inherited from

EventBusRedisFactory.init

___

### shutdown

• **shutdown**: (`cb`: `ICallback`\<`void`\>) => `void`

#### Type declaration

▸ (`cb`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

##### Returns

`void`

#### Inherited from

EventBusRedisFactory.shutdown

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

EventBusRedisFactory.emit

___

### getInstance

▸ **getInstance**(): `Error` \| `IEventBus`\<[`TRedisSMQEvent`](../README.md#tredissmqevent)\>

#### Returns

`Error` \| `IEventBus`\<[`TRedisSMQEvent`](../README.md#tredissmqevent)\>

#### Inherited from

EventBusRedisFactory.getInstance

___

### getSetInstance

▸ **getSetInstance**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`IEventBus`\<[`TRedisSMQEvent`](../README.md#tredissmqevent)\>\> |

#### Returns

`void`

#### Inherited from

EventBusRedisFactory.getSetInstance

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

EventBusRedisFactory.on

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

EventBusRedisFactory.once

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

EventBusRedisFactory.removeAllListeners

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

EventBusRedisFactory.removeListener
