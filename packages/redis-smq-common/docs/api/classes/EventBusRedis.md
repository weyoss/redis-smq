[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EventBusRedis

# Class: EventBusRedis\<Events\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `Events` | extends [`TEventBusEvent`](../README.md#teventbusevent) |

## Hierarchy

- [`EventEmitter`](EventEmitter.md)\<`Events`\>

  ↳ **`EventBusRedis`**

## Implements

- [`IEventBus`](../interfaces/IEventBus.md)\<`Events`\>

## Table of contents

### Methods

- [emit](EventBusRedis.md#emit)
- [on](EventBusRedis.md#on)
- [once](EventBusRedis.md#once)
- [removeAllListeners](EventBusRedis.md#removealllisteners)
- [removeListener](EventBusRedis.md#removelistener)
- [shutdown](EventBusRedis.md#shutdown)
- [createInstance](EventBusRedis.md#createinstance)

## Methods

### emit

▸ **emit**\<`E`\>(`event`, `...args`): `boolean`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `...args` | `Parameters`\<`Events`[`E`]\> |

#### Returns

`boolean`

#### Implementation of

[IEventBus](../interfaces/IEventBus.md).[emit](../interfaces/IEventBus.md#emit)

#### Overrides

[EventEmitter](EventEmitter.md).[emit](EventEmitter.md#emit)

___

### on

▸ **on**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | `Events`[`E`] |

#### Returns

`this`

#### Implementation of

[IEventBus](../interfaces/IEventBus.md).[on](../interfaces/IEventBus.md#on)

#### Overrides

[EventEmitter](EventEmitter.md).[on](EventEmitter.md#on)

___

### once

▸ **once**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | `Events`[`E`] |

#### Returns

`this`

#### Implementation of

[IEventBus](../interfaces/IEventBus.md).[once](../interfaces/IEventBus.md#once)

#### Overrides

[EventEmitter](EventEmitter.md).[once](EventEmitter.md#once)

___

### removeAllListeners

▸ **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `Extract`\<`E`, `string`\> |

#### Returns

`this`

#### Implementation of

[IEventBus](../interfaces/IEventBus.md).[removeAllListeners](../interfaces/IEventBus.md#removealllisteners)

#### Overrides

[EventEmitter](EventEmitter.md).[removeAllListeners](EventEmitter.md#removealllisteners)

___

### removeListener

▸ **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends `string` \| `number` \| `symbol` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | `Events`[`E`] |

#### Returns

`this`

#### Implementation of

[IEventBus](../interfaces/IEventBus.md).[removeListener](../interfaces/IEventBus.md#removelistener)

#### Overrides

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

#### Implementation of

[IEventBus](../interfaces/IEventBus.md).[shutdown](../interfaces/IEventBus.md#shutdown)

___

### createInstance

▸ **createInstance**\<`T`\>(`config`, `cb`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`TEventBusEvent`](../README.md#teventbusevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IRedisConfig`](../interfaces/IRedisConfig.md) |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<[`IEventBus`](../interfaces/IEventBus.md)\<`T`\>\> |

#### Returns

`void`
