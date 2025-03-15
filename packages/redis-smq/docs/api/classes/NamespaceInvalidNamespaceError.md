[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / NamespaceInvalidNamespaceError

# Class: NamespaceInvalidNamespaceError

## Hierarchy

- [`NamespaceError`](NamespaceError.md)

  ↳ **`NamespaceInvalidNamespaceError`**

## Table of contents

### Constructors

- [constructor](NamespaceInvalidNamespaceError.md#constructor)

### Properties

- [cause](NamespaceInvalidNamespaceError.md#cause)
- [message](NamespaceInvalidNamespaceError.md#message)
- [stack](NamespaceInvalidNamespaceError.md#stack)
- [prepareStackTrace](NamespaceInvalidNamespaceError.md#preparestacktrace)
- [stackTraceLimit](NamespaceInvalidNamespaceError.md#stacktracelimit)

### Accessors

- [name](NamespaceInvalidNamespaceError.md#name)

### Methods

- [captureStackTrace](NamespaceInvalidNamespaceError.md#capturestacktrace)

## Constructors

### constructor

• **new NamespaceInvalidNamespaceError**(`message?`): [`NamespaceInvalidNamespaceError`](NamespaceInvalidNamespaceError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`NamespaceInvalidNamespaceError`](NamespaceInvalidNamespaceError.md)

#### Inherited from

[NamespaceError](NamespaceError.md).[constructor](NamespaceError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[NamespaceError](NamespaceError.md).[cause](NamespaceError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[NamespaceError](NamespaceError.md).[message](NamespaceError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[NamespaceError](NamespaceError.md).[stack](NamespaceError.md#stack)

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

[NamespaceError](NamespaceError.md).[prepareStackTrace](NamespaceError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[NamespaceError](NamespaceError.md).[stackTraceLimit](NamespaceError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

NamespaceError.name

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

[NamespaceError](NamespaceError.md).[captureStackTrace](NamespaceError.md#capturestacktrace)
