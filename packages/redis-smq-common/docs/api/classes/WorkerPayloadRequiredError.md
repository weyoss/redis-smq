[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / WorkerPayloadRequiredError

# Class: WorkerPayloadRequiredError

## Hierarchy

- [`WorkerError`](WorkerError.md)

  ↳ **`WorkerPayloadRequiredError`**

## Table of contents

### Constructors

- [constructor](WorkerPayloadRequiredError.md#constructor)

### Properties

- [cause](WorkerPayloadRequiredError.md#cause)
- [message](WorkerPayloadRequiredError.md#message)
- [stack](WorkerPayloadRequiredError.md#stack)
- [prepareStackTrace](WorkerPayloadRequiredError.md#preparestacktrace)
- [stackTraceLimit](WorkerPayloadRequiredError.md#stacktracelimit)

### Accessors

- [name](WorkerPayloadRequiredError.md#name)

### Methods

- [captureStackTrace](WorkerPayloadRequiredError.md#capturestacktrace)

## Constructors

### constructor

• **new WorkerPayloadRequiredError**(): [`WorkerPayloadRequiredError`](WorkerPayloadRequiredError.md)

#### Returns

[`WorkerPayloadRequiredError`](WorkerPayloadRequiredError.md)

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
