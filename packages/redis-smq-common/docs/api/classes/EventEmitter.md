[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EventEmitter

# Class: EventEmitter\<Events\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `Events` | extends [`TEventEmitterEvent`](../README.md#teventemitterevent) |

## Hierarchy

- **`EventEmitter`**

  ↳ [`EventBus`](EventBus.md)

  ↳ [`EventBusRedis`](EventBusRedis.md)

  ↳ [`IRedisClient`](../interfaces/IRedisClient.md)

  ↳ [`Runnable`](Runnable.md)

  ↳ [`Timer`](Timer.md)

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)\<`Events`\>

## Table of contents

### Constructors

- [constructor](EventEmitter.md#constructor)

### Methods

- [emit](EventEmitter.md#emit)
- [on](EventEmitter.md#on)
- [once](EventEmitter.md#once)
- [removeAllListeners](EventEmitter.md#removealllisteners)
- [removeListener](EventEmitter.md#removelistener)

## Constructors

### constructor

• **new EventEmitter**\<`Events`\>(): [`EventEmitter`](EventEmitter.md)\<`Events`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Events` | extends [`TEventEmitterEvent`](../README.md#teventemitterevent) |

#### Returns

[`EventEmitter`](EventEmitter.md)\<`Events`\>

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

[IEventEmitter](../interfaces/IEventEmitter.md).[emit](../interfaces/IEventEmitter.md#emit)

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

[IEventEmitter](../interfaces/IEventEmitter.md).[on](../interfaces/IEventEmitter.md#on)

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

[IEventEmitter](../interfaces/IEventEmitter.md).[once](../interfaces/IEventEmitter.md#once)

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

[IEventEmitter](../interfaces/IEventEmitter.md).[removeAllListeners](../interfaces/IEventEmitter.md#removealllisteners)

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

[IEventEmitter](../interfaces/IEventEmitter.md).[removeListener](../interfaces/IEventEmitter.md#removelistener)
