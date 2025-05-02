[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / WorkerThreadError

# Class: WorkerThreadError

## Hierarchy

- [`WorkerError`](WorkerError.md)

  ↳ **`WorkerThreadError`**

## Table of contents

### Constructors

- [constructor](WorkerThreadError.md#constructor)

### Properties

- [cause](WorkerThreadError.md#cause)
- [message](WorkerThreadError.md#message)
- [stack](WorkerThreadError.md#stack)
- [prepareStackTrace](WorkerThreadError.md#preparestacktrace)
- [stackTraceLimit](WorkerThreadError.md#stacktracelimit)

### Accessors

- [name](WorkerThreadError.md#name)

### Methods

- [captureStackTrace](WorkerThreadError.md#capturestacktrace)

## Constructors

### constructor

• **new WorkerThreadError**(`msg`): [`WorkerThreadError`](WorkerThreadError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `msg` | [`TWorkerThreadChildMessage`](../README.md#tworkerthreadchildmessage) |

#### Returns

[`WorkerThreadError`](WorkerThreadError.md)

#### Overrides

[WorkerError](WorkerError.md).[constructor](WorkerError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[WorkerError](WorkerError.md).[cause](WorkerError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[WorkerError](WorkerError.md).[message](WorkerError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[WorkerError](WorkerError.md).[stack](WorkerError.md#stack)

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

[WorkerError](WorkerError.md).[prepareStackTrace](WorkerError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[WorkerError](WorkerError.md).[stackTraceLimit](WorkerError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

WorkerError.name

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

[WorkerError](WorkerError.md).[captureStackTrace](WorkerError.md#capturestacktrace)
