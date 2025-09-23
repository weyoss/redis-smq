[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Runnable

# Abstract Class: Runnable\<Event\>

A Runnable class that provides a foundation for managing long-running tasks.
It provides methods for starting, stopping, and handling errors during the execution of tasks.

## Extends

- [`EventEmitter`](EventEmitter.md)\<`Event`\>

## Extended by

- [`EventBus`](EventBus.md)
- [`RedisLock`](RedisLock.md)
- [`WorkerResourceGroup`](WorkerResourceGroup.md)

## Type Parameters

### Event

`Event` *extends* [`TEventEmitterEvent`](../type-aliases/TEventEmitterEvent.md)

The type of events that the Runnable class can emit.

## Methods

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`E`

##### args

...`Parameters`\<`Event`\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`emit`](EventEmitter.md#emit)

***

### getId()

> **getId**(): `string`

Retrieves the unique identifier of the Runnable instance.

#### Returns

`string`

- The unique identifier of the Runnable instance.

***

### isDown()

> **isDown**(): `boolean`

Checks if the Runnable instance is currently down.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is down, `false` otherwise.

***

### isGoingDown()

> **isGoingDown**(): `boolean`

Checks if the Runnable instance is currently going down.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is going down, `false` otherwise.

***

### isGoingUp()

> **isGoingUp**(): `boolean`

Checks if the Runnable instance is currently going up.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is going up, `false` otherwise.

***

### isRunning()

> **isRunning**(): `boolean`

Checks if the Runnable instance is currently running or going up.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is running or going up, `false` otherwise.

***

### isUp()

> **isUp**(): `boolean`

Checks if the Runnable instance is currently up.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is up, `false` otherwise.

***

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`E`

##### listener

`Event`\[`E`\]

#### Returns

`this`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`on`](EventEmitter.md#on)

***

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`E`

##### listener

`Event`\[`E`\]

#### Returns

`this`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`once`](EventEmitter.md#once)

***

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event?

`Extract`\<`E`, `string`\>

#### Returns

`this`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`removeAllListeners`](EventEmitter.md#removealllisteners)

***

### removeListener()

> **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`E`

##### listener

`Event`\[`E`\]

#### Returns

`this`

#### Inherited from

[`EventEmitter`](EventEmitter.md).[`removeListener`](EventEmitter.md#removelistener)

***

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

***

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
