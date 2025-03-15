[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / WatchedKeysChangedError

# Class: WatchedKeysChangedError

## Hierarchy

- [`RedisClientError`](RedisClientError.md)

  ↳ **`WatchedKeysChangedError`**

## Table of contents

### Constructors

- [constructor](WatchedKeysChangedError.md#constructor)

### Properties

- [cause](WatchedKeysChangedError.md#cause)
- [message](WatchedKeysChangedError.md#message)
- [stack](WatchedKeysChangedError.md#stack)
- [prepareStackTrace](WatchedKeysChangedError.md#preparestacktrace)
- [stackTraceLimit](WatchedKeysChangedError.md#stacktracelimit)

### Accessors

- [name](WatchedKeysChangedError.md#name)

### Methods

- [captureStackTrace](WatchedKeysChangedError.md#capturestacktrace)

## Constructors

### constructor

• **new WatchedKeysChangedError**(`msg?`): [`WatchedKeysChangedError`](WatchedKeysChangedError.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `msg` | `string` | `'One (or more) of the watched keys has been changed'` |

#### Returns

[`WatchedKeysChangedError`](WatchedKeysChangedError.md)

#### Overrides

[RedisClientError](RedisClientError.md).[constructor](RedisClientError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[RedisClientError](RedisClientError.md).[cause](RedisClientError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[RedisClientError](RedisClientError.md).[message](RedisClientError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[RedisClientError](RedisClientError.md).[stack](RedisClientError.md#stack)

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

Optional override for formatting stack traces

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Type declaration

▸ (`err`, `stackTraces`): `any`

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

#### Inherited from

[RedisClientError](RedisClientError.md).[prepareStackTrace](RedisClientError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[RedisClientError](RedisClientError.md).[stackTraceLimit](RedisClientError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

RedisClientError.name

## Methods

### captureStackTrace

▸ **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

[RedisClientError](RedisClientError.md).[captureStackTrace](RedisClientError.md#capturestacktrace)
