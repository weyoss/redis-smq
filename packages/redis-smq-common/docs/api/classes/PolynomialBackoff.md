[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / PolynomialBackoff

# Class: PolynomialBackoff

## Extends

- `Backoff`

## Constructors

### Constructor

> **new PolynomialBackoff**(`logger`, `config`): `PolynomialBackoff`

#### Parameters

##### logger

[`ILogger`](../interfaces/ILogger.md)

##### config

[`IBackoffConfig`](../interfaces/IBackoffConfig.md) = `{}`

#### Returns

`PolynomialBackoff`

#### Inherited from

`Backoff.constructor`

## Methods

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` _extends_ `string`

#### Parameters

##### event

`E`

##### args

...`any`[]

#### Returns

`boolean`

#### Inherited from

`Backoff.emit`

---

### ensureIsOperational()

> **ensureIsOperational**(`cb`): `void`

Ensures the Runnable instance is operational (either starting up or fully running).
If it's not operational, starts it.
Calls the callback when the instance is operational.

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)

Callback function to be called when the instance is operational.

#### Returns

`void`

#### Inherited from

`Backoff.ensureIsOperational`

---

### execute()

> **execute**\<`TResult`\>(`task`, `callback`): `void`

Execute a task with backoff retry

#### Type Parameters

##### TResult

`TResult`

#### Parameters

##### task

(`cb`) => `void`

##### callback

[`ICallback`](../interfaces/ICallback.md)\<`TResult`\>

#### Returns

`void`

#### Inherited from

`Backoff.execute`

---

### getAttempts()

> **getAttempts**(): `number`

#### Returns

`number`

#### Inherited from

`Backoff.getAttempts`

---

### getConfig()

> **getConfig**(): [`IBackoffParsedConfig`](../type-aliases/IBackoffParsedConfig.md)

#### Returns

[`IBackoffParsedConfig`](../type-aliases/IBackoffParsedConfig.md)

#### Inherited from

`Backoff.getConfig`

---

### getId()

> **getId**(): `string`

Retrieves the unique identifier of the Runnable instance.

#### Returns

`string`

- The unique identifier of the Runnable instance.

#### Inherited from

`Backoff.getId`

---

### isDown()

> **isDown**(): `boolean`

Checks if the Runnable instance is currently down.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is down, `false` otherwise.

#### Inherited from

`Backoff.isDown`

---

### isGoingDown()

> **isGoingDown**(): `boolean`

Checks if the Runnable instance is currently going down.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is going down, `false` otherwise.

#### Inherited from

`Backoff.isGoingDown`

---

### isGoingUp()

> **isGoingUp**(): `boolean`

Checks if the Runnable instance is currently going up.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is going up, `false` otherwise.

#### Inherited from

`Backoff.isGoingUp`

---

### isOperational()

> **isOperational**(): `boolean`

Checks if the Runnable is in an operational state where it can process work or start up.
Operational states:

- DOWN and GOING_UP (starting up)
- UP and not GOING_DOWN (fully operational)

Non-operational states:

- UP and GOING_DOWN (shutting down)
- DOWN and not GOING_UP (fully stopped)

#### Returns

`boolean`

#### Inherited from

`Backoff.isOperational`

---

### isRunning()

> **isRunning**(): `boolean`

Checks if the Runnable instance is currently running (fully up with no pending transitions).

#### Returns

`boolean`

- Returns `true` if the Runnable instance is fully up and running.

#### Inherited from

`Backoff.isRunning`

---

### isUp()

> **isUp**(): `boolean`

Checks if the Runnable instance is currently up.

#### Returns

`boolean`

- Returns `true` if the Runnable instance is up, `false` otherwise.

#### Inherited from

`Backoff.isUp`

---

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ `string`

#### Parameters

##### event

`E`

##### listener

(...`args`) => `void`

#### Returns

`this`

#### Inherited from

`Backoff.on`

---

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ `string`

#### Parameters

##### event

`E`

##### listener

(...`args`) => `void`

#### Returns

`this`

#### Inherited from

`Backoff.once`

---

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` _extends_ `string`

#### Parameters

##### event?

`Extract`\<`E`, `string`\>

#### Returns

`this`

#### Inherited from

`Backoff.removeAllListeners`

---

### removeListener()

> **removeListener**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ `string`

#### Parameters

##### event

`E`

##### listener

(...`args`) => `void`

#### Returns

`this`

#### Inherited from

`Backoff.removeListener`

---

### reset()

> **reset**(): `void`

Reset backoff state

#### Returns

`void`

#### Inherited from

`Backoff.reset`

---

### run()

> **run**(`cb`): `void`

Initiates the Runnable instance's execution.

The `run` method starts the Runnable instance by executing the `goingUp` tasks.
If the Runnable instance is already running or going up, the method will return immediately without executing any tasks.

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)

A callback function that will be called after the execution process is completed.
If an error occurs during the execution process, the error will be passed as the first parameter to the callback.
If the execution process is successful, the callback will be called with no arguments.

#### Returns

`void`

#### Inherited from

`Backoff.run`

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

[`ICallback`](../interfaces/ICallback.md)

A callback function that will be called after the shutdown process is completed.
If an error occurs during the shutdown process, the error will be passed as the first parameter to the callback.
If the shutdown process is successful, the callback will be called with no arguments.

#### Returns

`void`

#### Inherited from

`Backoff.shutdown`
