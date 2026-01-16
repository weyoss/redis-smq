[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EventBusRedis

# Class: EventBusRedis\<Events\>

EventBus with optional namespace support.

## Extends

- [`EventBus`](EventBus.md)\<`Events`\>

## Type Parameters

### Events

`Events` _extends_ [`TEventBusEvent`](../type-aliases/TEventBusEvent.md)

## Constructors

### Constructor

> **new EventBusRedis**\<`Events`\>(`config`, `namespace`): `EventBusRedis`\<`Events`\>

#### Parameters

##### config

[`IEventBusRedisConfig`](../interfaces/IEventBusRedisConfig.md)

##### namespace

`string` = `''`

#### Returns

`EventBusRedis`\<`Events`\>

#### Overrides

[`EventBus`](EventBus.md).[`constructor`](EventBus.md#constructor)

## Methods

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

Emit an event.

- 'error' events are always emitted unprefixed.
- Non-error events are namespaced if a namespace is configured.
- Non-error events require the bus to be running; otherwise an error is emitted and false is returned.

#### Type Parameters

##### E

`E` _extends_ `string` \| `number` \| `symbol`

#### Parameters

##### event

`E`

##### args

...`Parameters`\<`Events`\[`E`\]\>

#### Returns

`boolean`

#### Overrides

[`EventBus`](EventBus.md).[`emit`](EventBus.md#emit)

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

[`EventBus`](EventBus.md).[`ensureIsRunning`](EventBus.md#ensureisrunning)

---

### getId()

> **getId**(): `string`

Retrieves the unique identifier of the Runnable instance.

#### Returns

`string`

- The unique identifier of the Runnable instance.

#### Inherited from

[`EventBus`](EventBus.md).[`getId`](EventBus.md#getid)

---

### isDown()

> **isDown**(): `boolean`

Checks if the Runnable instance is currently down.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is down, `false` otherwise.

#### Inherited from

[`EventBus`](EventBus.md).[`isDown`](EventBus.md#isdown)

---

### isGoingDown()

> **isGoingDown**(): `boolean`

Checks if the Runnable instance is currently going down.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is going down, `false` otherwise.

#### Inherited from

[`EventBus`](EventBus.md).[`isGoingDown`](EventBus.md#isgoingdown)

---

### isGoingUp()

> **isGoingUp**(): `boolean`

Checks if the Runnable instance is currently going up.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is going up, `false` otherwise.

#### Inherited from

[`EventBus`](EventBus.md).[`isGoingUp`](EventBus.md#isgoingup)

---

### isRunning()

> **isRunning**(): `boolean`

Checks if the Runnable instance is currently running or going up.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is running or going up, `false` otherwise.

#### Inherited from

[`EventBus`](EventBus.md).[`isRunning`](EventBus.md#isrunning)

---

### isUp()

> **isUp**(): `boolean`

Checks if the Runnable instance is currently up.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is up, `false` otherwise.

#### Inherited from

[`EventBus`](EventBus.md).[`isUp`](EventBus.md#isup)

---

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

Add a listener for an event.

- 'error' listeners are registered unprefixed.
- Non-error listeners are registered with namespace if configured.

#### Type Parameters

##### E

`E` _extends_ `string` \| `number` \| `symbol`

#### Parameters

##### event

`E`

##### listener

`Events`\[`E`\]

#### Returns

`this`

#### Overrides

[`EventBus`](EventBus.md).[`on`](EventBus.md#on)

---

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

Add a one-time listener for an event.

- 'error' listeners are registered unprefixed.
- Non-error listeners are registered with namespace if configured.

#### Type Parameters

##### E

`E` _extends_ `string` \| `number` \| `symbol`

#### Parameters

##### event

`E`

##### listener

`Events`\[`E`\]

#### Returns

`this`

#### Overrides

[`EventBus`](EventBus.md).[`once`](EventBus.md#once)

---

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

Remove all listeners for an event or all events.

#### Type Parameters

##### E

`E` _extends_ `string` \| `number` \| `symbol`

#### Parameters

##### event?

`Extract`\<`E`, `string`\>

#### Returns

`this`

#### Overrides

[`EventBus`](EventBus.md).[`removeAllListeners`](EventBus.md#removealllisteners)

---

### removeListener()

> **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ `string` \| `number` \| `symbol`

#### Parameters

##### event

`E`

##### listener

`Events`\[`E`\]

#### Returns

`this`

#### Overrides

[`EventBus`](EventBus.md).[`removeListener`](EventBus.md#removelistener)

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

[`EventBus`](EventBus.md).[`run`](EventBus.md#run)

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

[`EventBus`](EventBus.md).[`shutdown`](EventBus.md#shutdown)
