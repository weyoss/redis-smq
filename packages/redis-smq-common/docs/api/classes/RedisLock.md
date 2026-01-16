[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / RedisLock

# Class: RedisLock

Represents a distributed locking mechanism using Redis.
Extends the Runnable class and implements locking, extending, and releasing operations.

## Extends

- [`Runnable`](Runnable.md)\<[`TLockerEvent`](../type-aliases/TLockerEvent.md)\>

## Constructors

### Constructor

> **new RedisLock**(`redisClient`, `logger`, `lockKey`, `ttl`, `retryOnFail`, `autoExtendInterval`): `RedisLock`

#### Parameters

##### redisClient

[`IRedisClient`](../interfaces/IRedisClient.md)

##### logger

[`ILogger`](../interfaces/ILogger.md)

##### lockKey

`string`

##### ttl

`number`

##### retryOnFail

`boolean` = `false`

##### autoExtendInterval

`number` = `0`

#### Returns

`RedisLock`

#### Overrides

`Runnable<TLockerEvent>.constructor`

## Methods

### acquireLock()

> **acquireLock**(`cb`): `void`

Attempts to acquire a lock for the current instance.

This method attempts to acquire a lock for the current instance using the Redis client.
If the lock is successfully acquired, the callback is invoked with `true`.
If the lock acquisition fails due to a lock already being held by another instance,
the callback is invoked with `false`. If an error occurs during the lock acquisition process,
the callback is invoked with the corresponding error.

If auto-extension is enabled, the lock's TTL will be extended automatically at regular intervals.

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`boolean`\>

A callback function that will be invoked with a boolean indicating the lock acquisition result,
or an error (if any) upon successful execution.

#### Returns

`void`

---

### emit()

> **emit**\<`E`\>(`event`, ...`args`): `boolean`

#### Type Parameters

##### E

`E` _extends_ keyof [`TLockerEvent`](../type-aliases/TLockerEvent.md)

#### Parameters

##### event

`E`

##### args

...`Parameters`\<[`TLockerEvent`](../type-aliases/TLockerEvent.md)\[`E`\]\>

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

### extendLock()

> **extendLock**(`cb`): `void`

Attempts to extend the lock's time-to-live (TTL) if auto-extension is not enabled.

This function extends the lock's TTL by the specified time, provided that auto-extension is not enabled.
If auto-extension is enabled, an error is returned. If the lock is not currently held, an error is returned.

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`void`\>

A callback function that will be invoked with an error (if any) or `undefined` upon successful execution.

#### Returns

`void`

#### Throws

- If auto-extension is enabled.

#### Throws

- If the lock is not currently held.

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

### isLocked()

> **isLocked**(): `boolean`

Checks if the lock is currently held.

This method returns a boolean indicating whether the lock is currently held by this instance.

#### Returns

`boolean`

- Returns `true` if the lock is held, `false` otherwise.

---

### isReleased()

> **isReleased**(): `boolean`

Checks if the lock is released.

This method returns a boolean indicating whether the lock is currently released.

#### Returns

`boolean`

- Returns `true` if the lock is released, `false` otherwise.

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

### on()

> **on**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TLockerEvent`](../type-aliases/TLockerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TLockerEvent`](../type-aliases/TLockerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

[`Runnable`](Runnable.md).[`on`](Runnable.md#on)

---

### once()

> **once**\<`E`\>(`event`, `listener`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TLockerEvent`](../type-aliases/TLockerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TLockerEvent`](../type-aliases/TLockerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

[`Runnable`](Runnable.md).[`once`](Runnable.md#once)

---

### releaseLock()

> **releaseLock**(`cb`): `void`

Releases the lock held by the current instance.

This method attempts to release the lock held by the current instance.
If the lock is not currently held, the method does nothing and invokes the callback with `undefined`.
If an error occurs during the release process, the callback is invoked with the corresponding error.

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`void`\>

A callback function that will be invoked with an error (if any) or `undefined` upon successful execution.

#### Returns

`void`

---

### removeAllListeners()

> **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type Parameters

##### E

`E` _extends_ keyof [`TLockerEvent`](../type-aliases/TLockerEvent.md)

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

`E` _extends_ keyof [`TLockerEvent`](../type-aliases/TLockerEvent.md)

#### Parameters

##### event

`E`

##### listener

[`TLockerEvent`](../type-aliases/TLockerEvent.md)\[`E`\]

#### Returns

`this`

#### Inherited from

[`Runnable`](Runnable.md).[`removeListener`](Runnable.md#removelistener)

---

### run()

> **run**(`cb`): `void`

Overrides the `run` method from the `Runnable` class to handle the lock acquisition process.

#### Parameters

##### cb

[`ICallback`](../interfaces/ICallback.md)\<`boolean`\>

A callback function that will be invoked with a boolean indicating the lock acquisition result,
or an error (if any) upon successful execution.

#### Returns

`void`

#### Remarks

This method attempts to acquire a lock for the current instance using the Redis client.
If the lock is successfully acquired, the callback is invoked with `true`.
If the lock acquisition fails due to a lock already being held by another instance,
the callback is invoked with `false`. If an error occurs during the lock acquisition process,
the callback is invoked with the corresponding error.

If auto-extension is enabled, the lock's TTL will be extended automatically at regular intervals.

#### Overrides

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
