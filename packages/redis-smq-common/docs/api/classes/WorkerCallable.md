[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / WorkerCallable

# Class: WorkerCallable\<Payload, Reply\>

## Type parameters

| Name |
| :------ |
| `Payload` |
| `Reply` |

## Hierarchy

- `Worker`\<`Payload`, `Reply`\>

  ↳ **`WorkerCallable`**

## Implements

- [`IWorkerCallable`](../interfaces/IWorkerCallable.md)\<`Payload`, `Reply`\>

## Table of contents

### Constructors

- [constructor](WorkerCallable.md#constructor)

### Methods

- [call](WorkerCallable.md#call)
- [emit](WorkerCallable.md#emit)
- [getId](WorkerCallable.md#getid)
- [on](WorkerCallable.md#on)
- [once](WorkerCallable.md#once)
- [postMessage](WorkerCallable.md#postmessage)
- [removeAllListeners](WorkerCallable.md#removealllisteners)
- [removeListener](WorkerCallable.md#removelistener)
- [shutdown](WorkerCallable.md#shutdown)

## Constructors

### constructor

• **new WorkerCallable**\<`Payload`, `Reply`\>(`workerFilename`, `logger?`): [`WorkerCallable`](WorkerCallable.md)\<`Payload`, `Reply`\>

#### Type parameters

| Name |
| :------ |
| `Payload` |
| `Reply` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerFilename` | `string` |
| `logger?` | [`ILogger`](../interfaces/ILogger.md) |

#### Returns

[`WorkerCallable`](WorkerCallable.md)\<`Payload`, `Reply`\>

#### Overrides

Worker\<Payload, Reply\>.constructor

## Methods

### call

▸ **call**(`payload`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `payload` | `Payload` |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<`Reply`\> |

#### Returns

`void`

#### Implementation of

[IWorkerCallable](../interfaces/IWorkerCallable.md).[call](../interfaces/IWorkerCallable.md#call)

___

### emit

▸ **emit**\<`E`\>(`event`, `...args`): `boolean`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof `TWorkerEvent` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `...args` | `Parameters`\<`TWorkerEvent`[`E`]\> |

#### Returns

`boolean`

#### Inherited from

Worker.emit

___

### getId

▸ **getId**(): `string`

Gets the worker ID.

#### Returns

`string`

The worker ID.

#### Inherited from

Worker.getId

___

### on

▸ **on**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof `TWorkerEvent` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | `TWorkerEvent`[`E`] |

#### Returns

`this`

#### Inherited from

Worker.on

___

### once

▸ **once**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof `TWorkerEvent` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | `TWorkerEvent`[`E`] |

#### Returns

`this`

#### Inherited from

Worker.once

___

### postMessage

▸ **postMessage**(`message`): `void`

Posts a message to the worker thread.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | [`TWorkerThreadParentMessage`](../README.md#tworkerthreadparentmessage) | The message to post to the worker thread. |

#### Returns

`void`

#### Inherited from

Worker.postMessage

___

### removeAllListeners

▸ **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof `TWorkerEvent` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `Extract`\<`E`, `string`\> |

#### Returns

`this`

#### Inherited from

Worker.removeAllListeners

___

### removeListener

▸ **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof `TWorkerEvent` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | `TWorkerEvent`[`E`] |

#### Returns

`this`

#### Inherited from

Worker.removeListener

___

### shutdown

▸ **shutdown**(`cb`): `void`

Shuts down the worker thread.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<`void`\> | The callback function to call after shutdown. |

#### Returns

`void`

#### Inherited from

Worker.shutdown
