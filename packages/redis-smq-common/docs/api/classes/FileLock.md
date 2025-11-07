[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / FileLock

# Class: FileLock

A file-based locking mechanism for coordinating access to shared resources
across processes. Provides methods to acquire and release locks with configurable
retry behavior, stale lock detection, and automatic cleanup on process exit.
Maintains lock state with periodic updates to prevent locks from being considered
stale by other processes.

## Constructors

### Constructor

> **new FileLock**(): `FileLock`

#### Returns

`FileLock`

## Methods

### acquireLock()

> **acquireLock**(`lockFile`, `options`): `Promise`\<`void`\>

Acquires a lock on the specified resource

#### Parameters

##### lockFile

`string`

Lock file

##### options

Lock acquisition options

###### retries?

`number`

###### retryDelay?

`number`

###### staleTimeout?

`number`

###### updateInterval?

`number`

#### Returns

`Promise`\<`void`\>

Promise that resolves when the lock is acquired

***

### isLockHeld()

> **isLockHeld**(`lockFile`): `boolean`

Checks if a lock is currently held by this process

#### Parameters

##### lockFile

`string`

Lock file

#### Returns

`boolean`

True if the lock is held by this process

***

### releaseLock()

> **releaseLock**(`lockFile`): `Promise`\<`void`\>

Releases a previously acquired lock

#### Parameters

##### lockFile

`string`

Lock file

#### Returns

`Promise`\<`void`\>

Promise that resolves when the lock is released
