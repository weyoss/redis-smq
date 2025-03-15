[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / MessageInvalidParametersError

# Class: MessageInvalidParametersError

## Hierarchy

- [`MessageError`](MessageError.md)

  ↳ **`MessageInvalidParametersError`**

## Table of contents

### Constructors

- [constructor](MessageInvalidParametersError.md#constructor)

### Properties

- [cause](MessageInvalidParametersError.md#cause)
- [message](MessageInvalidParametersError.md#message)
- [stack](MessageInvalidParametersError.md#stack)
- [prepareStackTrace](MessageInvalidParametersError.md#preparestacktrace)
- [stackTraceLimit](MessageInvalidParametersError.md#stacktracelimit)

### Accessors

- [name](MessageInvalidParametersError.md#name)

### Methods

- [captureStackTrace](MessageInvalidParametersError.md#capturestacktrace)

## Constructors

### constructor

• **new MessageInvalidParametersError**(`message?`): [`MessageInvalidParametersError`](MessageInvalidParametersError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`MessageInvalidParametersError`](MessageInvalidParametersError.md)

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
