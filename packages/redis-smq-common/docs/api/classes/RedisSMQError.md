[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / RedisSMQError

# Class: RedisSMQError

## Hierarchy

- `Error`

  ↳ **`RedisSMQError`**

  ↳↳ [`PanicError`](PanicError.md)

  ↳↳ [`AbortError`](AbortError.md)

  ↳↳ [`EventBusError`](EventBusError.md)

  ↳↳ [`LockError`](LockError.md)

  ↳↳ [`LoggerError`](LoggerError.md)

  ↳↳ [`RedisClientError`](RedisClientError.md)

  ↳↳ [`TimerError`](TimerError.md)

  ↳↳ [`WorkerError`](WorkerError.md)

## Table of contents

### Constructors

- [constructor](RedisSMQError.md#constructor)

### Properties

- [cause](RedisSMQError.md#cause)
- [message](RedisSMQError.md#message)
- [stack](RedisSMQError.md#stack)
- [prepareStackTrace](RedisSMQError.md#preparestacktrace)
- [stackTraceLimit](RedisSMQError.md#stacktracelimit)

### Accessors

- [name](RedisSMQError.md#name)

### Methods

- [captureStackTrace](RedisSMQError.md#capturestacktrace)

## Constructors

### constructor

• **new RedisSMQError**(`message?`): [`RedisSMQError`](RedisSMQError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`RedisSMQError`](RedisSMQError.md)

#### Overrides

Error.constructor

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

Error.cause

___

### message

• **message**: `string`

#### Inherited from

Error.message

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

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

Error.prepareStackTrace

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Overrides

Error.name

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

Error.captureStackTrace
