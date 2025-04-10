[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / RedisServerUnsupportedPlatformError

# Class: RedisServerUnsupportedPlatformError

## Hierarchy

- [`RedisServerError`](RedisServerError.md)

  ↳ **`RedisServerUnsupportedPlatformError`**

## Table of contents

### Constructors

- [constructor](RedisServerUnsupportedPlatformError.md#constructor)

### Properties

- [cause](RedisServerUnsupportedPlatformError.md#cause)
- [message](RedisServerUnsupportedPlatformError.md#message)
- [stack](RedisServerUnsupportedPlatformError.md#stack)
- [prepareStackTrace](RedisServerUnsupportedPlatformError.md#preparestacktrace)
- [stackTraceLimit](RedisServerUnsupportedPlatformError.md#stacktracelimit)

### Accessors

- [name](RedisServerUnsupportedPlatformError.md#name)

### Methods

- [captureStackTrace](RedisServerUnsupportedPlatformError.md#capturestacktrace)

## Constructors

### constructor

• **new RedisServerUnsupportedPlatformError**(): [`RedisServerUnsupportedPlatformError`](RedisServerUnsupportedPlatformError.md)

#### Returns

[`RedisServerUnsupportedPlatformError`](RedisServerUnsupportedPlatformError.md)

#### Overrides

[RedisServerError](RedisServerError.md).[constructor](RedisServerError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[RedisServerError](RedisServerError.md).[cause](RedisServerError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[RedisServerError](RedisServerError.md).[message](RedisServerError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[RedisServerError](RedisServerError.md).[stack](RedisServerError.md#stack)

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

[RedisServerError](RedisServerError.md).[prepareStackTrace](RedisServerError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[RedisServerError](RedisServerError.md).[stackTraceLimit](RedisServerError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

RedisServerError.name

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

[RedisServerError](RedisServerError.md).[captureStackTrace](RedisServerError.md#capturestacktrace)
