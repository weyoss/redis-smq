[redis-smq](../README.md) / [Exports](../README.md) / MessageNotFoundError

# Class: MessageNotFoundError

## Hierarchy

- [`MessageError`](MessageError.md)

  ↳ **`MessageNotFoundError`**

## Table of contents

### Constructors

- [constructor](MessageNotFoundError.md#constructor)

### Properties

- [message](MessageNotFoundError.md#message)
- [stack](MessageNotFoundError.md#stack)
- [prepareStackTrace](MessageNotFoundError.md#preparestacktrace)
- [stackTraceLimit](MessageNotFoundError.md#stacktracelimit)

### Accessors

- [name](MessageNotFoundError.md#name)

### Methods

- [captureStackTrace](MessageNotFoundError.md#capturestacktrace)

## Constructors

### constructor

• **new MessageNotFoundError**(`msg?`): [`MessageNotFoundError`](MessageNotFoundError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `msg?` | `string` |

#### Returns

[`MessageNotFoundError`](MessageNotFoundError.md)

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
