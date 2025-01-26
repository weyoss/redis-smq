[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / MessageMessageNotFoundError

# Class: MessageMessageNotFoundError

## Hierarchy

- [`MessageError`](MessageError.md)

  ↳ **`MessageMessageNotFoundError`**

## Table of contents

### Constructors

- [constructor](MessageMessageNotFoundError.md#constructor)

### Properties

- [cause](MessageMessageNotFoundError.md#cause)
- [message](MessageMessageNotFoundError.md#message)
- [stack](MessageMessageNotFoundError.md#stack)
- [prepareStackTrace](MessageMessageNotFoundError.md#preparestacktrace)
- [stackTraceLimit](MessageMessageNotFoundError.md#stacktracelimit)

### Accessors

- [name](MessageMessageNotFoundError.md#name)

### Methods

- [captureStackTrace](MessageMessageNotFoundError.md#capturestacktrace)

## Constructors

### constructor

• **new MessageMessageNotFoundError**(`message?`): [`MessageMessageNotFoundError`](MessageMessageNotFoundError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`MessageMessageNotFoundError`](MessageMessageNotFoundError.md)

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

[MessageError](MessageError.md).[captureStackTrace](MessageError.md#capturestacktrace)
