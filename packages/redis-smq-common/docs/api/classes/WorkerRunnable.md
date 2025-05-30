[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / WorkerRunnable

# Class: WorkerRunnable\<InitialPayload\>

## Type parameters

| Name |
| :------ |
| `InitialPayload` |

## Hierarchy

- `Worker`\<`void`, `void`\>

  ↳ **`WorkerRunnable`**

## Implements

- [`IWorkerRunnable`](../interfaces/IWorkerRunnable.md)

## Table of contents

### Constructors

- [constructor](WorkerRunnable.md#constructor)

### Methods

- [emit](WorkerRunnable.md#emit)
- [getId](WorkerRunnable.md#getid)
- [on](WorkerRunnable.md#on)
- [once](WorkerRunnable.md#once)
- [postMessage](WorkerRunnable.md#postmessage)
- [removeAllListeners](WorkerRunnable.md#removealllisteners)
- [removeListener](WorkerRunnable.md#removelistener)
- [run](WorkerRunnable.md#run)
- [shutdown](WorkerRunnable.md#shutdown)

## Constructors

### constructor

• **new WorkerRunnable**\<`InitialPayload`\>(`workerFilename`, `initialPayload?`, `logger?`): [`WorkerRunnable`](WorkerRunnable.md)\<`InitialPayload`\>

#### Type parameters

| Name |
| :------ |
| `InitialPayload` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerFilename` | `string` |
| `initialPayload?` | `InitialPayload` |
| `logger?` | [`ILogger`](../interfaces/ILogger.md) |

#### Returns

[`WorkerRunnable`](WorkerRunnable.md)\<`InitialPayload`\>

#### Overrides

Worker\<void, void\>.constructor

## Methods

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

### run

▸ **run**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<`void`\> |

#### Returns

`void`

#### Implementation of

[IWorkerRunnable](../interfaces/IWorkerRunnable.md).[run](../interfaces/IWorkerRunnable.md#run)

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

[IWorkerRunnable](../interfaces/IWorkerRunnable.md).[shutdown](../interfaces/IWorkerRunnable.md#shutdown)

#### Overrides

Worker.shutdown
