[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / MessageMessageExchangeRequiredError

# Class: MessageMessageExchangeRequiredError

## Hierarchy

- [`MessageError`](MessageError.md)

  ↳ **`MessageMessageExchangeRequiredError`**

## Table of contents

### Constructors

- [constructor](MessageMessageExchangeRequiredError.md#constructor)

### Properties

- [cause](MessageMessageExchangeRequiredError.md#cause)
- [message](MessageMessageExchangeRequiredError.md#message)
- [stack](MessageMessageExchangeRequiredError.md#stack)
- [prepareStackTrace](MessageMessageExchangeRequiredError.md#preparestacktrace)
- [stackTraceLimit](MessageMessageExchangeRequiredError.md#stacktracelimit)

### Accessors

- [name](MessageMessageExchangeRequiredError.md#name)

### Methods

- [captureStackTrace](MessageMessageExchangeRequiredError.md#capturestacktrace)

## Constructors

### constructor

• **new MessageMessageExchangeRequiredError**(`message?`): [`MessageMessageExchangeRequiredError`](MessageMessageExchangeRequiredError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`MessageMessageExchangeRequiredError`](MessageMessageExchangeRequiredError.md)

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
