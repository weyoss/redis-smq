[redis-smq](../README.md) / [Exports](../README.md) / MessageDeleteError

# Class: MessageDeleteError

## Hierarchy

- [`MessageError`](MessageError.md)

  ↳ **`MessageDeleteError`**

## Table of contents

### Constructors

- [constructor](MessageDeleteError.md#constructor)

### Properties

- [message](MessageDeleteError.md#message)
- [stack](MessageDeleteError.md#stack)
- [prepareStackTrace](MessageDeleteError.md#preparestacktrace)
- [stackTraceLimit](MessageDeleteError.md#stacktracelimit)

### Accessors

- [name](MessageDeleteError.md#name)

### Methods

- [captureStackTrace](MessageDeleteError.md#capturestacktrace)

## Constructors

### constructor

• **new MessageDeleteError**(`msg?`): [`MessageDeleteError`](MessageDeleteError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `msg?` | `string` |

#### Returns

[`MessageDeleteError`](MessageDeleteError.md)

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
