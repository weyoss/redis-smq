[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IEventBus

# Interface: IEventBus\<Events\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `Events` | extends [`TEventBusEvent`](../README.md#teventbusevent) |

## Hierarchy

- [`IEventEmitter`](IEventEmitter.md)\<`Events`\>

  ↳ **`IEventBus`**

## Implemented by

- [`EventBus`](../classes/EventBus.md)
- [`EventBusRedis`](../classes/EventBusRedis.md)

## Table of contents

### Methods

- [emit](IEventBus.md#emit)
- [on](IEventBus.md#on)
- [once](IEventBus.md#once)
- [removeAllListeners](IEventBus.md#removealllisteners)
- [removeListener](IEventBus.md#removelistener)
- [shutdown](IEventBus.md#shutdown)

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

#### Inherited from

[IEventEmitter](IEventEmitter.md).[emit](IEventEmitter.md#emit)

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

#### Inherited from

[IEventEmitter](IEventEmitter.md).[on](IEventEmitter.md#on)

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

#### Inherited from

[IEventEmitter](IEventEmitter.md).[once](IEventEmitter.md#once)

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
| `event?` | `E` |

#### Returns

`this`

#### Inherited from

[IEventEmitter](IEventEmitter.md).[removeAllListeners](IEventEmitter.md#removealllisteners)

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

#### Inherited from

[IEventEmitter](IEventEmitter.md).[removeListener](IEventEmitter.md#removelistener)

___

### shutdown

▸ **shutdown**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](ICallback.md)\<`void`\> |

#### Returns

`void`
