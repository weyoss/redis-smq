[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / FileLock

# Class: FileLock

A file-based locking mechanism for coordinating access to shared resources
across processes. Provides methods to acquire and release locks with configurable
retry behavior, stale lock detection, and automatic cleanup on process exit.
Maintains lock state with periodic updates to prevent locks from being considered
stale by other processes.

## Table of contents

### Constructors

- [constructor](FileLock.md#constructor)

### Methods

- [acquireLock](FileLock.md#acquirelock)
- [isLockHeld](FileLock.md#islockheld)
- [releaseLock](FileLock.md#releaselock)

## Constructors

### constructor

• **new FileLock**(): [`FileLock`](FileLock.md)

#### Returns

[`FileLock`](FileLock.md)

## Methods

### acquireLock

▸ **acquireLock**(`lockFile`, `options?`): `Promise`\<`void`\>

Acquires a lock on the specified resource

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `lockFile` | `string` | Lock file |
| `options` | `Object` | Lock acquisition options |
| `options.retries?` | `number` | - |
| `options.retryDelay?` | `number` | - |
| `options.staleTimeout?` | `number` | - |
| `options.updateInterval?` | `number` | - |

#### Returns

`Promise`\<`void`\>

Promise that resolves when the lock is acquired

___

### isLockHeld

▸ **isLockHeld**(`lockFile`): `boolean`

Checks if a lock is currently held by this process

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `lockFile` | `string` | Lock file |

#### Returns

`boolean`

True if the lock is held by this process

___

### releaseLock

▸ **releaseLock**(`lockFile`): `Promise`\<`void`\>

Releases a previously acquired lock

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `lockFile` | `string` | Lock file |

#### Returns

`Promise`\<`void`\>

Promise that resolves when the lock is released
