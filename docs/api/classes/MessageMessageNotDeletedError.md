[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / MessageMessageNotDeletedError

# Class: MessageMessageNotDeletedError

## Hierarchy

- [`MessageError`](MessageError.md)

  ↳ **`MessageMessageNotDeletedError`**

## Table of contents

### Constructors

- [constructor](MessageMessageNotDeletedError.md#constructor)

### Properties

- [cause](MessageMessageNotDeletedError.md#cause)
- [message](MessageMessageNotDeletedError.md#message)
- [stack](MessageMessageNotDeletedError.md#stack)
- [prepareStackTrace](MessageMessageNotDeletedError.md#preparestacktrace)
- [stackTraceLimit](MessageMessageNotDeletedError.md#stacktracelimit)

### Accessors

- [name](MessageMessageNotDeletedError.md#name)

### Methods

- [captureStackTrace](MessageMessageNotDeletedError.md#capturestacktrace)

## Constructors

### constructor

• **new MessageMessageNotDeletedError**(`message?`)

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
