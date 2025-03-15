[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Timer

# Class: Timer

## Hierarchy

- [`EventEmitter`](EventEmitter.md)\<[`TTimerEvent`](../README.md#ttimerevent)\>

  ↳ **`Timer`**

## Table of contents

### Constructors

- [constructor](Timer.md#constructor)

### Methods

- [emit](Timer.md#emit)
- [on](Timer.md#on)
- [once](Timer.md#once)
- [removeAllListeners](Timer.md#removealllisteners)
- [removeListener](Timer.md#removelistener)
- [reset](Timer.md#reset)
- [setInterval](Timer.md#setinterval)
- [setTimeout](Timer.md#settimeout)

## Constructors

### constructor

• **new Timer**(): [`Timer`](Timer.md)

#### Returns

[`Timer`](Timer.md)

#### Inherited from

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
| `...args` | `Parameters`\<[`TTimerEvent`](../README.md#ttimerevent)[`E`]\> |

#### Returns

`boolean`

#### Inherited from

[EventEmitter](EventEmitter.md).[emit](EventEmitter.md#emit)

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
| `listener` | [`TTimerEvent`](../README.md#ttimerevent)[`E`] |

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
| `listener` | [`TTimerEvent`](../README.md#ttimerevent)[`E`] |

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
| `listener` | [`TTimerEvent`](../README.md#ttimerevent)[`E`] |

#### Returns

`this`

#### Inherited from

[EventEmitter](EventEmitter.md).[removeListener](EventEmitter.md#removelistener)

___

### reset

▸ **reset**(): `void`

#### Returns

`void`

___

### setInterval

▸ **setInterval**(`fn`, `interval?`): `boolean`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `fn` | [`TFunction`](../README.md#tfunction)\<`void`, `any`\> | `undefined` |
| `interval` | `number` | `1000` |

#### Returns

`boolean`

___

### setTimeout

▸ **setTimeout**(`fn`, `timeout`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | [`TFunction`](../README.md#tfunction)\<`void`, `any`\> |
| `timeout` | `number` |

#### Returns

`boolean`
