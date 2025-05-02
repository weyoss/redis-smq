[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EventBusRedisFactory

# Class: EventBusRedisFactory\<Event\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `Event` | extends [`TEventBusEvent`](../README.md#teventbusevent) |

## Hierarchy

- [`EventEmitter`](EventEmitter.md)\<`Pick`\<[`TRedisClientEvent`](../README.md#tredisclientevent), ``"error"``\>\>

  ↳ **`EventBusRedisFactory`**

## Table of contents

### Constructors

- [constructor](EventBusRedisFactory.md#constructor)

### Methods

- [emit](EventBusRedisFactory.md#emit)
- [getInstance](EventBusRedisFactory.md#getinstance)
- [getSetInstance](EventBusRedisFactory.md#getsetinstance)
- [init](EventBusRedisFactory.md#init)
- [on](EventBusRedisFactory.md#on)
- [once](EventBusRedisFactory.md#once)
- [removeAllListeners](EventBusRedisFactory.md#removealllisteners)
- [removeListener](EventBusRedisFactory.md#removelistener)
- [shutdown](EventBusRedisFactory.md#shutdown)

## Constructors

### constructor

• **new EventBusRedisFactory**\<`Event`\>(`config`): [`EventBusRedisFactory`](EventBusRedisFactory.md)\<`Event`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Event` | extends [`TEventBusEvent`](../README.md#teventbusevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IRedisConfig`](../interfaces/IRedisConfig.md) |

#### Returns

[`EventBusRedisFactory`](EventBusRedisFactory.md)\<`Event`\>

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

▸ **getInstance**(): `Error` \| [`IEventBus`](../interfaces/IEventBus.md)\<`Event`\>

#### Returns

`Error` \| [`IEventBus`](../interfaces/IEventBus.md)\<`Event`\>

___

### getSetInstance

▸ **getSetInstance**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<[`IEventBus`](../interfaces/IEventBus.md)\<`Event`\>\> |

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
