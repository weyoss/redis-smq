>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / MessageExchangeRequiredError

# Class: MessageExchangeRequiredError

## Hierarchy

- [`MessageError`](MessageError.md)

  ↳ **`MessageExchangeRequiredError`**

## Table of contents

### Constructors

- [constructor](MessageExchangeRequiredError.md#constructor)

### Properties

- [message](MessageExchangeRequiredError.md#message)
- [stack](MessageExchangeRequiredError.md#stack)
- [prepareStackTrace](MessageExchangeRequiredError.md#preparestacktrace)
- [stackTraceLimit](MessageExchangeRequiredError.md#stacktracelimit)

### Accessors

- [name](MessageExchangeRequiredError.md#name)

### Methods

- [captureStackTrace](MessageExchangeRequiredError.md#capturestacktrace)

## Constructors

### constructor

• **new MessageExchangeRequiredError**(): [`MessageExchangeRequiredError`](MessageExchangeRequiredError.md)

#### Returns

[`MessageExchangeRequiredError`](MessageExchangeRequiredError.md)

#### Overrides

[MessageError](MessageError.md).[constructor](MessageError.md#constructor)

## Properties

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
