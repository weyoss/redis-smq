[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Locker

# Class: Locker

Represents a distributed locking mechanism using Redis.
Extends the Runnable class and implements locking, extending, and releasing operations.

## Hierarchy

- [`Runnable`](Runnable.md)\<[`TLockerEvent`](../README.md#tlockerevent)\>

  ↳ **`Locker`**

## Table of contents

### Constructors

- [constructor](Locker.md#constructor)

### Methods

- [acquireLock](Locker.md#acquirelock)
- [emit](Locker.md#emit)
- [extendLock](Locker.md#extendlock)
- [getId](Locker.md#getid)
- [isDown](Locker.md#isdown)
- [isGoingDown](Locker.md#isgoingdown)
- [isGoingUp](Locker.md#isgoingup)
- [isLocked](Locker.md#islocked)
- [isReleased](Locker.md#isreleased)
- [isRunning](Locker.md#isrunning)
- [isUp](Locker.md#isup)
- [on](Locker.md#on)
- [once](Locker.md#once)
- [releaseLock](Locker.md#releaselock)
- [removeAllListeners](Locker.md#removealllisteners)
- [removeListener](Locker.md#removelistener)
- [run](Locker.md#run)
- [shutdown](Locker.md#shutdown)

## Constructors

### constructor

• **new Locker**(`redisClient`, `logger`, `lockKey`, `ttl`, `retryOnFail?`, `autoExtendInterval?`): [`Locker`](Locker.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `redisClient` | [`IRedisClient`](../interfaces/IRedisClient.md) | `undefined` |
| `logger` | [`ILogger`](../interfaces/ILogger.md) | `undefined` |
| `lockKey` | `string` | `undefined` |
| `ttl` | `number` | `undefined` |
| `retryOnFail` | `boolean` | `false` |
| `autoExtendInterval` | `number` | `0` |

#### Returns

[`Locker`](Locker.md)

#### Overrides

Runnable\<TLockerEvent\>.constructor

## Methods

### acquireLock

▸ **acquireLock**(`cb`): `void`

Attempts to acquire a lock for the current instance.

This method attempts to acquire a lock for the current instance using the Redis client.
If the lock is successfully acquired, the callback is invoked with `true`.
If the lock acquisition fails due to a lock already being held by another instance,
the callback is invoked with `false`. If an error occurs during the lock acquisition process,
the callback is invoked with the corresponding error.

If auto-extension is enabled, the lock's TTL will be extended automatically at regular intervals.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<`boolean`\> | A callback function that will be invoked with a boolean indicating the lock acquisition result, or an error (if any) upon successful execution. |

#### Returns

`void`

___

### emit

▸ **emit**\<`E`\>(`event`, `...args`): `boolean`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TLockerEvent`](../README.md#tlockerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `...args` | `Parameters`\<[`TLockerEvent`](../README.md#tlockerevent)[`E`]\> |

#### Returns

`boolean`

#### Inherited from

[Runnable](Runnable.md).[emit](Runnable.md#emit)

___

### extendLock

▸ **extendLock**(`cb`): `void`

Attempts to extend the lock's time-to-live (TTL) if auto-extension is not enabled.

This function extends the lock's TTL by the specified time, provided that auto-extension is not enabled.
If auto-extension is enabled, an error is returned. If the lock is not currently held, an error is returned.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<`void`\> | A callback function that will be invoked with an error (if any) or `undefined` upon successful execution. |

#### Returns

`void`

**`Throws`**

- If auto-extension is enabled.

**`Throws`**

- If the lock is not currently held.

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

### isLocked

▸ **isLocked**(): `boolean`

Checks if the lock is currently held.

This method returns a boolean indicating whether the lock is currently held by this instance.

#### Returns

`boolean`

- Returns `true` if the lock is held, `false` otherwise.

___

### isReleased

▸ **isReleased**(): `boolean`

Checks if the lock is released.

This method returns a boolean indicating whether the lock is currently released.

#### Returns

`boolean`

- Returns `true` if the lock is released, `false` otherwise.

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

### on

▸ **on**\<`E`\>(`event`, `listener`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TLockerEvent`](../README.md#tlockerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TLockerEvent`](../README.md#tlockerevent)[`E`] |

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
| `E` | extends keyof [`TLockerEvent`](../README.md#tlockerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TLockerEvent`](../README.md#tlockerevent)[`E`] |

#### Returns

`this`

#### Inherited from

[Runnable](Runnable.md).[once](Runnable.md#once)

___

### releaseLock

▸ **releaseLock**(`cb`): `void`

Releases the lock held by the current instance.

This method attempts to release the lock held by the current instance.
If the lock is not currently held, the method does nothing and invokes the callback with `undefined`.
If an error occurs during the release process, the callback is invoked with the corresponding error.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<`void`\> | A callback function that will be invoked with an error (if any) or `undefined` upon successful execution. |

#### Returns

`void`

___

### removeAllListeners

▸ **removeAllListeners**\<`E`\>(`event?`): `this`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends keyof [`TLockerEvent`](../README.md#tlockerevent) |

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
| `E` | extends keyof [`TLockerEvent`](../README.md#tlockerevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `E` |
| `listener` | [`TLockerEvent`](../README.md#tlockerevent)[`E`] |

#### Returns

`this`

#### Inherited from

[Runnable](Runnable.md).[removeListener](Runnable.md#removelistener)

___

### run

▸ **run**(`cb`): `void`

Overrides the `run` method from the `Runnable` class to handle the lock acquisition process.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | [`ICallback`](../interfaces/ICallback.md)\<`boolean`\> | A callback function that will be invoked with a boolean indicating the lock acquisition result, or an error (if any) upon successful execution. |

#### Returns

`void`

**`Remarks`**

This method attempts to acquire a lock for the current instance using the Redis client.
If the lock is successfully acquired, the callback is invoked with `true`.
If the lock acquisition fails due to a lock already being held by another instance,
the callback is invoked with `false`. If an error occurs during the lock acquisition process,
the callback is invoked with the corresponding error.

If auto-extension is enabled, the lock's TTL will be extended automatically at regular intervals.

#### Overrides

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
