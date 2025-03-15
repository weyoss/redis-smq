[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / WorkerError

# Class: WorkerError

## Hierarchy

- [`RedisSMQError`](RedisSMQError.md)

  ↳ **`WorkerError`**

  ↳↳ [`WorkerThreadError`](WorkerThreadError.md)

  ↳↳ [`WorkerPayloadRequiredError`](WorkerPayloadRequiredError.md)

  ↳↳ [`WorkerAlreadyRunningError`](WorkerAlreadyRunningError.md)

  ↳↳ [`WorkerAlreadyDownError`](WorkerAlreadyDownError.md)

## Table of contents

### Constructors

- [constructor](WorkerError.md#constructor)

### Properties

- [cause](WorkerError.md#cause)
- [message](WorkerError.md#message)
- [stack](WorkerError.md#stack)
- [prepareStackTrace](WorkerError.md#preparestacktrace)
- [stackTraceLimit](WorkerError.md#stacktracelimit)

### Accessors

- [name](WorkerError.md#name)

### Methods

- [captureStackTrace](WorkerError.md#capturestacktrace)

## Constructors

### constructor

• **new WorkerError**(`message?`): [`WorkerError`](WorkerError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`WorkerError`](WorkerError.md)

#### Inherited from

[RedisSMQError](RedisSMQError.md).[constructor](RedisSMQError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[RedisSMQError](RedisSMQError.md).[cause](RedisSMQError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[RedisSMQError](RedisSMQError.md).[message](RedisSMQError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[RedisSMQError](RedisSMQError.md).[stack](RedisSMQError.md#stack)

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

[RedisSMQError](RedisSMQError.md).[prepareStackTrace](RedisSMQError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[RedisSMQError](RedisSMQError.md).[stackTraceLimit](RedisSMQError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

RedisSMQError.name

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

[RedisSMQError](RedisSMQError.md).[captureStackTrace](RedisSMQError.md#capturestacktrace)
