[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / WorkerCluster

# Class: WorkerCluster

A Runnable class that provides a foundation for managing long-running tasks.
It provides methods for starting, stopping, and handling errors during the execution of tasks.

## Extends

- [`Runnable`](Runnable.md)\<[`TWorkerClusterEvent`](../type-aliases/TWorkerClusterEvent.md)\>

## Constructors

### Constructor

> **new WorkerCluster**(`redisClient`, `logger`, `resourceGroupId`): `WorkerCluster`

#### Parameters

##### redisClient

[`IRedisClient`](../interfaces/IRedisClient.md)

##### logger

[`ILogger`](../interfaces/ILogger.md)

##### resourceGroupId

`string`

#### Returns

`WorkerCluster`

#### Overrides

`Runnable<TWorkerClusterEvent>.constructor`

## Methods

### addWorker()

> **addWorker**(`filename`, `payload`): [`RunnableWorker`](RunnableWorker.md)\<`unknown`\>

#### Parameters

##### filename

`string`

##### payload

`unknown`

#### Returns

[`RunnableWorker`](RunnableWorker.md)\<`unknown`\>

---

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` _extends_ keyof [`TWorkerClusterEvent`](../type-aliases/TWorkerClusterEvent.md)

#### Parameters

##### event

`E`

##### args

...`Parameters`\<[`TWorkerClusterEvent`](../type-aliases/TWorkerClusterEvent.md)\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

[`Runnable`](Runnable.md).[`emit`](Runnable.md#emit)

---

### ensureIsRunning()

> **ensureIsRunning**(`cb`): `void`

Ensures the Runnable instance is running. If it's not running or going up, starts it.
Calls the callback when the instance is fully up and running.

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`void`\>

Callback function to be called when the instance is up and running.

#### Returns

`void`

#### Inherited from

[`Runnable`](Runnable.md).[`ensureIsRunning`](Runnable.md#ensureisrunning)

---

### getId()

> **getId**(): `string`

Retrieves the unique identifier of the Runnable instance.

#### Returns

`string`

- The unique identifier of the Runnable instance.

#### Inherited from

[`Runnable`](Runnable.md).[`getId`](Runnable.md#getid)

---

### isDown()

> **isDown**(): `boolean`

Checks if the Runnable instance is currently down.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is down, `false` otherwise.

#### Inherited from

[`Runnable`](Runnable.md).[`isDown`](Runnable.md#isdown)

---

### isGoingDown()

> **isGoingDown**(): `boolean`

Checks if the Runnable instance is currently going down.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is going down, `false` otherwise.

#### Inherited from

[`Runnable`](Runnable.md).[`isGoingDown`](Runnable.md#isgoingdown)

---

### isGoingUp()

> **isGoingUp**(): `boolean`

Checks if the Runnable instance is currently going up.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is going up, `false` otherwise.

#### Inherited from

[`Runnable`](Runnable.md).[`isGoingUp`](Runnable.md#isgoingup)

---

### isRunning()

> **isRunning**(): `boolean`

Checks if the Runnable instance is currently running or going up.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is running or going up, `false` otherwise.

#### Inherited from

[`Runnable`](Runnable.md).[`isRunning`](Runnable.md#isrunning)

---

### isUp()

> **isUp**(): `boolean`

Checks if the Runnable instance is currently up.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is up, `false` otherwise.

#### Inherited from

[`Runnable`](Runnable.md).[`isUp`](Runnable.md#isup)

---

### loadFromDir()

> **loadFromDir**\<`WorkerPayload`\>(`workersDir`, `payload`, `cb`): `void`

#### Type Parameters

##### WorkerPayload

`WorkerPayload` = `unknown`

#### Parameters

##### workersDir

`string`

##### payload

`WorkerPayload`

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`void`\>

#### Returns

`void`

---

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TWorkerClusterEvent`](../type-aliases/TWorkerClusterEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TWorkerClusterEvent`](../type-aliases/TWorkerClusterEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

[`Runnable`](Runnable.md).[`on`](Runnable.md#on)

---

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TWorkerClusterEvent`](../type-aliases/TWorkerClusterEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TWorkerClusterEvent`](../type-aliases/TWorkerClusterEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

[`Runnable`](Runnable.md).[`once`](Runnable.md#once)

---

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TWorkerClusterEvent`](../type-aliases/TWorkerClusterEvent.md)

#### Parameters

##### event?

`Extract`\<`E`, `string`\>

#### Returns

`this`

#### Inherited from

[`Runnable`](Runnable.md).[`removeAllListeners`](Runnable.md#removealllisteners)

---

### removeListener()

> **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TWorkerClusterEvent`](../type-aliases/TWorkerClusterEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TWorkerClusterEvent`](../type-aliases/TWorkerClusterEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

[`Runnable`](Runnable.md).[`removeListener`](Runnable.md#removelistener)

---

### run()

> **run**(`cb`): `void`

Initiates the Runnable instance's execution.

The `run` method starts the Runnable instance by executing the `goingUp` tasks.
If the Runnable instance is already running or going up, the method will return immediately without executing any tasks.

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`boolean`\>

A callback function that will be called after the execution process is completed.
If an error occurs during the execution process, the error will be passed as the first parameter to the callback.
If the execution process is successful, the callback will be called with a boolean parameter indicating whether the Runnable instance was running or not.
If the Runnable instance was not running, the callback will be called with `true`.
If the Runnable instance was already running, the callback will be called with `false`.

#### Returns

`void`

#### Inherited from

[`Runnable`](Runnable.md).[`run`](Runnable.md#run)

---

### shutdown()

> **shutdown**(`cb`): `void`

Performs a graceful shutdown of the Runnable instance.

The shutdown process involves executing the `goingDown` tasks, which are responsible for cleaning up resources.
The shutdown behavior depends on the current state of the Runnable instance:

- If the Runnable is running (`isRunning()`) and going up (`isGoingUp()`), the shutdown process will rollback the going up state.
- If the Runnable is running (`isRunning()`) and up (`isUp()`), the shutdown process will mark the Runnable as going down.
- After executing the `goingDown` tasks, the Runnable will call the `down` method to finalize the shutdown process.

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`void`\>

A callback function that will be called after the shutdown process is completed.
If an error occurs during the shutdown process, the error will be passed as the first parameter to the callback.
If the shutdown process is successful, the callback will be called with no arguments.

#### Returns

`void`

#### Inherited from

[`Runnable`](Runnable.md).[`shutdown`](Runnable.md#shutdown)
