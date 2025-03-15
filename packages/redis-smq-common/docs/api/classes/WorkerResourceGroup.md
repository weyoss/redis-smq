[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / WorkerResourceGroup

# Class: WorkerResourceGroup

A Runnable class that provides a foundation for managing long-running tasks.
It provides methods for starting, stopping, and handling errors during the execution of tasks.

## Hierarchy

- [`Runnable`](Runnable.md)\<[`TWorkerResourceGroupEvent`](../README.md#tworkerresourcegroupevent)\>

  ↳ **`WorkerResourceGroup`**

## Table of contents

### Constructors

- [constructor](WorkerResourceGroup.md#constructor)

### Methods

- [addWorker](WorkerResourceGroup.md#addworker)
- [emit](WorkerResourceGroup.md#emit)
- [getId](WorkerResourceGroup.md#getid)
- [isDown](WorkerResourceGroup.md#isdown)
- [isGoingDown](WorkerResourceGroup.md#isgoingdown)
- [isGoingUp](WorkerResourceGroup.md#isgoingup)
- [isRunning](WorkerResourceGroup.md#isrunning)
- [isUp](WorkerResourceGroup.md#isup)
- [loadFromDir](WorkerResourceGroup.md#loadfromdir)
- [on](WorkerResourceGroup.md#on)
- [once](WorkerResourceGroup.md#once)
- [removeAllListeners](WorkerResourceGroup.md#removealllisteners)
- [removeListener](WorkerResourceGroup.md#removelistener)
- [run](WorkerResourceGroup.md#run)
- [shutdown](WorkerResourceGroup.md#shutdown)

## Constructors

### constructor

• **new WorkerResourceGroup**(`redisClient`, `logger`, `resourceGroupId`): [`WorkerResourceGroup`](WorkerResourceGroup.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `redisClient` | [`IRedisClient`](../interfaces/IRedisClient.md) |
| `logger` | [`ILogger`](../interfaces/ILogger.md) |
| `resourceGroupId` | `string` |

#### Returns

[`WorkerResourceGroup`](WorkerResourceGroup.md)

#### Overrides

Runnable\<TWorkerResourceGroupEvent\>.constructor

## Methods

### addWorker

▸ **addWorker**(`filename`, `payload`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `filename` | `string` |
| `payload` | `unknown` |

#### Returns

`void`

___

### emit

▸ **emit**\<`E`\>(`event`, `...args`): `boolean`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends ``"workerResourceGroup.error"`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `...args` | `Parameters`\<[`TWorkerResourceGroupEvent`](../README.md#tworkerresourcegroupevent)[`E`]\> |

#### Returns

`boolean`

#### Inherited from

[Runnable](Runnable.md).[emit](Runnable.md#emit)

___

### getId

▸ **getId**(): `string`

Retrieves the unique identifier of the Runnable instance.

#### Returns

`string`

- The unique identifier of the Runnable instance.

#### Inherited from

[Runnable](Runnable.md).[getId](Runnable.md#getid)

___

### isDown

▸ **isDown**(): `boolean`

Checks if the Runnable instance is currently down.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is down, `false` otherwise.

#### Inherited from

[Runnable](Runnable.md).[isDown](Runnable.md#isdown)

___

### isGoingDown

▸ **isGoingDown**(): `boolean`

Checks if the Runnable instance is currently going down.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is going down, `false` otherwise.

#### Inherited from

[Runnable](Runnable.md).[isGoingDown](Runnable.md#isgoingdown)

___

### isGoingUp

▸ **isGoingUp**(): `boolean`

Checks if the Runnable instance is currently going up.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is going up, `false` otherwise.

#### Inherited from

[Runnable](Runnable.md).[isGoingUp](Runnable.md#isgoingup)

___

### isRunning

▸ **isRunning**(): `boolean`

Checks if the Runnable instance is currently running or going up.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is running or going up, `false` otherwise.

#### Inherited from

[Runnable](Runnable.md).[isRunning](Runnable.md#isrunning)

___

### isUp

▸ **isUp**(): `boolean`

Checks if the Runnable instance is currently up.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is up, `false` otherwise.

#### Inherited from

[Runnable](Runnable.md).[isUp](Runnable.md#isup)

___

### loadFromDir

▸ **loadFromDir**(`workersDir`, `payload`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `workersDir` | `string` |
| `payload` | `unknown` |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<`void`\> |

#### Returns

`void`

___

### on

▸ **on**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends ``"workerResourceGroup.error"`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TWorkerResourceGroupEvent`](../README.md#tworkerresourcegroupevent)[`E`] |

#### Returns

`this`

#### Inherited from

[Runnable](Runnable.md).[on](Runnable.md#on)

___

### once

▸ **once**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends ``"workerResourceGroup.error"`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TWorkerResourceGroupEvent`](../README.md#tworkerresourcegroupevent)[`E`] |

#### Returns

`this`

#### Inherited from

[Runnable](Runnable.md).[once](Runnable.md#once)

___

### removeAllListeners

▸ **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends ``"workerResourceGroup.error"`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `Extract`\<`E`, `string`\> |

#### Returns

`this`

#### Inherited from

[Runnable](Runnable.md).[removeAllListeners](Runnable.md#removealllisteners)

___

### removeListener

▸ **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends ``"workerResourceGroup.error"`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TWorkerResourceGroupEvent`](../README.md#tworkerresourcegroupevent)[`E`] |

#### Returns

`this`

#### Inherited from

[Runnable](Runnable.md).[removeListener](Runnable.md#removelistener)

___

### run

▸ **run**(`cb`): `void`

Initiates the Runnable instance's execution.

The `run` method starts the Runnable instance by executing the `goingUp` tasks.
If the Runnable instance is already running or going up, the method will return immediately without executing any tasks.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<`boolean`\> | A callback function that will be called after the execution process is completed. If an error occurs during the execution process, the error will be passed as the first parameter to the callback. If the execution process is successful, the callback will be called with a boolean parameter indicating whether the Runnable instance was running or not. If the Runnable instance was not running, the callback will be called with `true`. If the Runnable instance was already running, the callback will be called with `false`. |

#### Returns

`void`

#### Inherited from

[Runnable](Runnable.md).[run](Runnable.md#run)

___

### shutdown

▸ **shutdown**(`cb`): `void`

Performs a graceful shutdown of the Runnable instance.

The shutdown process involves executing the `goingDown` tasks, which are responsible for cleaning up resources.
The shutdown behavior depends on the current state of the Runnable instance:
- If the Runnable is running (`isRunning()`) and going up (`isGoingUp()`), the shutdown process will rollback the going up state.
- If the Runnable is running (`isRunning()`) and up (`isUp()`), the shutdown process will mark the Runnable as going down.
- After executing the `goingDown` tasks, the Runnable will call the `down` method to finalize the shutdown process.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<`void`\> | A callback function that will be called after the shutdown process is completed. If an error occurs during the shutdown process, the error will be passed as the first parameter to the callback. If the shutdown process is successful, the callback will be called with no arguments. |

#### Returns

`void`

#### Inherited from

[Runnable](Runnable.md).[shutdown](Runnable.md#shutdown)
