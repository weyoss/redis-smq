[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / MessageMessageNotRequeuableError

# Class: MessageMessageNotRequeuableError

## Hierarchy

- [`MessageError`](MessageError.md)

  ↳ **`MessageMessageNotRequeuableError`**

## Table of contents

### Constructors

- [constructor](MessageMessageNotRequeuableError.md#constructor)

### Properties

- [cause](MessageMessageNotRequeuableError.md#cause)
- [message](MessageMessageNotRequeuableError.md#message)
- [stack](MessageMessageNotRequeuableError.md#stack)
- [prepareStackTrace](MessageMessageNotRequeuableError.md#preparestacktrace)
- [stackTraceLimit](MessageMessageNotRequeuableError.md#stacktracelimit)

### Accessors

- [name](MessageMessageNotRequeuableError.md#name)

### Methods

- [captureStackTrace](MessageMessageNotRequeuableError.md#capturestacktrace)

## Constructors

### constructor

• **new MessageMessageNotRequeuableError**(`message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Inherited from

[MessageError](MessageError.md).[constructor](MessageError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[MessageError](MessageError.md).[cause](MessageError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[MessageError](MessageError.md).[message](MessageError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[MessageError](MessageError.md).[stack](MessageError.md#stack)

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

[MessageError](MessageError.md).[prepareStackTrace](MessageError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[MessageError](MessageError.md).[stackTraceLimit](MessageError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

MessageError.name

## Methods

### captureStackTrace

▸ `Static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

[MessageError](MessageError.md).[captureStackTrace](MessageError.md#capturestacktrace)
