[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Heartbeat

# Class: Heartbeat\<T\>

A robust base class for long-running components/services with explicit lifecycle management.

Features:

- `goingUp()` / `goingDown()` hooks returning callback-based tasks (executed in series)
- Safe concurrent `run()` / `shutdown()` / `ensureIsOperational()` calls
- Automatic abort of startup when shutdown is requested

## Extends

- [`Runnable`](Runnable.md)\<[`THeartbeatEvent`](../type-aliases/THeartbeatEvent.md)\<`T`\>\>

## Type Parameters

### T

`T` = `Record`\<`string`, `unknown`\>

The type of events that the Runnable class can emit.

## Constructors

### Constructor

> **new Heartbeat**\<`T`\>(`redisClient`, `logger`, `config`, `dataFn`): `Heartbeat`\<`T`\>

#### Parameters

##### redisClient

[`IRedisClient`](../interfaces/IRedisClient.md)

##### logger

[`ILogger`](../interfaces/ILogger.md)

##### config

[`IHeartbeatConfig`](../interfaces/IHeartbeatConfig.md)

##### dataFn

[`THeartbeatDataFn`](../type-aliases/THeartbeatDataFn.md)\<`T`\>

#### Returns

`Heartbeat`\<`T`\>

#### Overrides

`Runnable< THeartbeatEvent<T> >.constructor`

## Methods

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` _extends_ keyof [`THeartbeatEvent`](../type-aliases/THeartbeatEvent.md)\<`T`\>

#### Parameters

##### event

`E`

##### args

...`Parameters`\<[`THeartbeatEvent`](../type-aliases/THeartbeatEvent.md)\<`T`\>\[`E`\]\>

#### Returns

`boolean`

#### Inherited from

[`Runnable`](Runnable.md).[`emit`](Runnable.md#emit)

---

### ensureIsOperational()

#### Call Signature

> **ensureIsOperational**(): `Promise`\<`void`\>

Ensures the Runnable instance is operational (either starting up or fully running).

This method checks the current state and takes appropriate action:

- If the instance is running (`isRunning()`), the callback is called immediately.
- If the instance is going up (`isGoingUp()`), the callback is queued to be called when startup completes.
- If the instance is down (`isDown()`), it initiates startup and calls the callback when ready.
- If the instance is going down (`isGoingDown()`), an error is returned as operation cannot be ensured during shutdown.

This is useful for methods that need the component to be ready before performing operations,
automatically starting it if it's not already running.

**Use Cases:**

- Ensuring a service is ready before processing requests
- Lazy initialization of components
- Recovery scenarios where the component might have been stopped

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided, otherwise returns void.

##### Throws

When called while the instance is shutting down.

##### Throws

Any error that occurs during startup if the instance was down.

##### Example

```typescript
// Using callback pattern
class MessageProcessor extends Runnable {
  processMessage(message: string, cb: ICallback) {
    this.ensureIsOperational((err) => {
      if (err) return cb(err);
      // Process message now that we're operational
      this.handleMessage(message, cb);
    });
  }
}

// Using promise pattern
class MessageProcessor extends Runnable {
  async processMessage(message: string): Promise<void> {
    await this.ensureIsOperational();
    // Process message now that we're operational
    await this.handleMessage(message);
  }
}

// Usage
const processor = new MessageProcessor();

// This will automatically start the processor if needed
await processor.processMessage('Hello');

// Subsequent calls will use the already running instance
await processor.processMessage('World');
```

##### Inherited from

[`Runnable`](Runnable.md).[`ensureIsOperational`](Runnable.md#ensureisoperational)

#### Call Signature

> **ensureIsOperational**(`cb`): `void`

Ensures the Runnable instance is operational (either starting up or fully running).

This method checks the current state and takes appropriate action:

- If the instance is running (`isRunning()`), the callback is called immediately.
- If the instance is going up (`isGoingUp()`), the callback is queued to be called when startup completes.
- If the instance is down (`isDown()`), it initiates startup and calls the callback when ready.
- If the instance is going down (`isGoingDown()`), an error is returned as operation cannot be ensured during shutdown.

This is useful for methods that need the component to be ready before performing operations,
automatically starting it if it's not already running.

**Use Cases:**

- Ensuring a service is ready before processing requests
- Lazy initialization of components
- Recovery scenarios where the component might have been stopped

##### Parameters

###### cb

[`ICallback`](../interfaces/ICallback.md)

Optional callback function to be called when the instance is operational.

- If no error occurs, the callback is called with `null` (or no arguments).
- If the instance is shutting down, an `AbortError` is passed.
- If startup fails, the error is passed.
- If not provided, the method returns a Promise that resolves when operational or rejects with any error.

##### Returns

`void`

- Returns a Promise if no callback is provided, otherwise returns void.

##### Throws

When called while the instance is shutting down.

##### Throws

Any error that occurs during startup if the instance was down.

##### Example

```typescript
// Using callback pattern
class MessageProcessor extends Runnable {
  processMessage(message: string, cb: ICallback) {
    this.ensureIsOperational((err) => {
      if (err) return cb(err);
      // Process message now that we're operational
      this.handleMessage(message, cb);
    });
  }
}

// Using promise pattern
class MessageProcessor extends Runnable {
  async processMessage(message: string): Promise<void> {
    await this.ensureIsOperational();
    // Process message now that we're operational
    await this.handleMessage(message);
  }
}

// Usage
const processor = new MessageProcessor();

// This will automatically start the processor if needed
await processor.processMessage('Hello');

// Subsequent calls will use the already running instance
await processor.processMessage('World');
```

##### Inherited from

[`Runnable`](Runnable.md).[`ensureIsOperational`](Runnable.md#ensureisoperational)

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

[`Runnable`](Runnable.md).[`isOperational`](Runnable.md#isoperational)

---

### isRunning()

> **isRunning**(): `boolean`

Checks if the Runnable instance is currently running (fully up with no pending transitions).

#### Returns

`boolean`

- Returns `true` if the Runnable instance is fully up and running.

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

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`THeartbeatEvent`](../type-aliases/THeartbeatEvent.md)\<`T`\>

#### Parameters

##### event

`E`

##### listener

[`THeartbeatEvent`](../type-aliases/THeartbeatEvent.md)\<`T`\>\[`E`\]

#### Returns

`this`

#### Inherited from

[`Runnable`](Runnable.md).[`on`](Runnable.md#on)

---

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`THeartbeatEvent`](../type-aliases/THeartbeatEvent.md)\<`T`\>

#### Parameters

##### event

`E`

##### listener

[`THeartbeatEvent`](../type-aliases/THeartbeatEvent.md)\<`T`\>\[`E`\]

#### Returns

`this`

#### Inherited from

[`Runnable`](Runnable.md).[`once`](Runnable.md#once)

---

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`THeartbeatEvent`](../type-aliases/THeartbeatEvent.md)\<`T`\>

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

`E` _extends_ keyof [`THeartbeatEvent`](../type-aliases/THeartbeatEvent.md)\<`T`\>

#### Parameters

##### event

`E`

##### listener

[`THeartbeatEvent`](../type-aliases/THeartbeatEvent.md)\<`T`\>\[`E`\]

#### Returns

`this`

#### Inherited from

[`Runnable`](Runnable.md).[`removeListener`](Runnable.md#removelistener)

---

### run()

#### Call Signature

> **run**(): `Promise`\<`void`\>

Initiates the Runnable instance's execution.

This method starts the Runnable instance by executing all tasks defined in the `goingUp()` hook.
The startup sequence is executed in series, and each task's completion is awaited before proceeding.

**State Transitions:**

- If the instance is already running (`isRunning()`), the callback is called immediately with no error.
- If the instance is already going up, the callback is queued to be called when startup completes.
- If the instance is going down, an error is returned as startup cannot proceed during shutdown.
- If the instance is down, the startup process begins and the callback will be called when startup completes or fails.

**Error Handling:**

- If any task in the startup sequence fails, the startup is aborted and the error is propagated.
- If `forceShutdownOnError` is `true` (default), the instance will automatically begin shutdown after a startup error.

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided, otherwise returns void.

##### Example

```typescript
// Using callback pattern
const runnable = new MyRunnable();
runnable.run((err) => {
  if (err) {
    console.error('Failed to start:', err);
  } else {
    console.log('Started successfully');
  }
});

// Using promise pattern
await runnable.run();
console.log('Started successfully');

// Multiple calls are safe - only one startup process runs
runnable.run((err) => console.log('First callback'));
runnable.run((err) => console.log('Second callback')); // Queued
```

##### Inherited from

[`Runnable`](Runnable.md).[`run`](Runnable.md#run)

#### Call Signature

> **run**(`cb`): `void`

Initiates the Runnable instance's execution.

This method starts the Runnable instance by executing all tasks defined in the `goingUp()` hook.
The startup sequence is executed in series, and each task's completion is awaited before proceeding.

**State Transitions:**

- If the instance is already running (`isRunning()`), the callback is called immediately with no error.
- If the instance is already going up, the callback is queued to be called when startup completes.
- If the instance is going down, an error is returned as startup cannot proceed during shutdown.
- If the instance is down, the startup process begins and the callback will be called when startup completes or fails.

**Error Handling:**

- If any task in the startup sequence fails, the startup is aborted and the error is propagated.
- If `forceShutdownOnError` is `true` (default), the instance will automatically begin shutdown after a startup error.

##### Parameters

###### cb

[`ICallback`](../interfaces/ICallback.md)

Optional callback function to be called when the startup process completes.

- If no error occurs, the callback is called with `null` (or no arguments).
- If an error occurs during startup, the error is passed as the first argument.
- If not provided, the method returns a Promise that resolves when startup completes or rejects with any error.

##### Returns

`void`

- Returns a Promise if no callback is provided, otherwise returns void.

##### Example

```typescript
// Using callback pattern
const runnable = new MyRunnable();
runnable.run((err) => {
  if (err) {
    console.error('Failed to start:', err);
  } else {
    console.log('Started successfully');
  }
});

// Using promise pattern
await runnable.run();
console.log('Started successfully');

// Multiple calls are safe - only one startup process runs
runnable.run((err) => console.log('First callback'));
runnable.run((err) => console.log('Second callback')); // Queued
```

##### Inherited from

[`Runnable`](Runnable.md).[`run`](Runnable.md#run)

---

### shutdown()

#### Call Signature

> **shutdown**(): `Promise`\<`void`\>

Performs a graceful shutdown of the Runnable instance.

This method initiates a clean shutdown process by executing all tasks defined in the `goingDown()` hook.
The shutdown sequence is executed in series, and each task's completion is awaited before proceeding.

**State Transitions:**

- **If the instance is starting up (`isGoingUp()`)**:
  - Startup is aborted (rolled back)
  - All pending startup callbacks receive an `AbortError`
  - Shutdown tasks are executed immediately
- **If the instance is fully running (`isUp()`)**:
  - The instance transitions to going down state
  - Shutdown tasks are executed
  - Once complete, the instance transitions to down state
- **If already down or going down**:
  - No action is taken, but callbacks are queued to be called when shutdown completes
- **If not operational**:
  - Success is returned immediately (already down)

**Error Handling:**

- If any task in the shutdown sequence fails, the error is logged but shutdown continues
- The instance always transitions to down state regardless of task errors
- All queued callbacks are eventually called

**Idempotency:**

- Calling `shutdown()` multiple times is safe
- Subsequent calls will queue their callbacks to be called when the shutdown process completes

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided, otherwise returns void.

##### Example

```typescript
// Using callback pattern
const runnable = new MyRunnable();
await runnable.run();

runnable.shutdown((err) => {
  if (err) {
    console.error('Error during shutdown:', err);
  } else {
    console.log('Shutdown complete');
  }
});

// Using promise pattern
await runnable.run();
await runnable.shutdown();
console.log('Shutdown complete');

// Shutdown during startup
runnable.run(); // Starts async startup
await runnable.shutdown(); // Aborts startup and shuts down

// Multiple shutdown calls are safe
runnable.shutdown(() => console.log('First'));
runnable.shutdown(() => console.log('Second')); // Called after shutdown
```

##### Inherited from

[`Runnable`](Runnable.md).[`shutdown`](Runnable.md#shutdown)

#### Call Signature

> **shutdown**(`cb`): `void`

Performs a graceful shutdown of the Runnable instance.

This method initiates a clean shutdown process by executing all tasks defined in the `goingDown()` hook.
The shutdown sequence is executed in series, and each task's completion is awaited before proceeding.

**State Transitions:**

- **If the instance is starting up (`isGoingUp()`)**:
  - Startup is aborted (rolled back)
  - All pending startup callbacks receive an `AbortError`
  - Shutdown tasks are executed immediately
- **If the instance is fully running (`isUp()`)**:
  - The instance transitions to going down state
  - Shutdown tasks are executed
  - Once complete, the instance transitions to down state
- **If already down or going down**:
  - No action is taken, but callbacks are queued to be called when shutdown completes
- **If not operational**:
  - Success is returned immediately (already down)

**Error Handling:**

- If any task in the shutdown sequence fails, the error is logged but shutdown continues
- The instance always transitions to down state regardless of task errors
- All queued callbacks are eventually called

**Idempotency:**

- Calling `shutdown()` multiple times is safe
- Subsequent calls will queue their callbacks to be called when the shutdown process completes

##### Parameters

###### cb

[`ICallback`](../interfaces/ICallback.md)

Optional callback function to be called when the shutdown process completes.

- If no error occurs, the callback is called with `null` (or no arguments).
- Any errors during shutdown are passed to the callback as the first argument.
- If not provided, the method returns a Promise that resolves when shutdown completes or rejects with any error.

##### Returns

`void`

- Returns a Promise if no callback is provided, otherwise returns void.

##### Example

```typescript
// Using callback pattern
const runnable = new MyRunnable();
await runnable.run();

runnable.shutdown((err) => {
  if (err) {
    console.error('Error during shutdown:', err);
  } else {
    console.log('Shutdown complete');
  }
});

// Using promise pattern
await runnable.run();
await runnable.shutdown();
console.log('Shutdown complete');

// Shutdown during startup
runnable.run(); // Starts async startup
await runnable.shutdown(); // Aborts startup and shuts down

// Multiple shutdown calls are safe
runnable.shutdown(() => console.log('First'));
runnable.shutdown(() => console.log('Second')); // Called after shutdown
```

##### Inherited from

[`Runnable`](Runnable.md).[`shutdown`](Runnable.md#shutdown)

---

### areComponentsAlive()

> `static` **areComponentsAlive**(`redisClient`, `heartbeatKeys`, `cb`): `void`

#### Parameters

##### redisClient

[`IRedisClient`](../interfaces/IRedisClient.md)

##### heartbeatKeys

`string`[]

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`Record`\<`string`, `boolean`\>\>

#### Returns

`void`

---

### isComponentAlive()

> `static` **isComponentAlive**(`redisClient`, `heartbeatKey`, `cb`): `void`

#### Parameters

##### redisClient

[`IRedisClient`](../interfaces/IRedisClient.md)

##### heartbeatKey

`string`

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`boolean`\>

#### Returns

`void`
