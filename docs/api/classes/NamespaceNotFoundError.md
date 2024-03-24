[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / NamespaceNotFoundError

# Class: NamespaceNotFoundError

## Hierarchy

- [`NamespaceError`](NamespaceError.md)

  ↳ **`NamespaceNotFoundError`**

## Table of contents

### Constructors

- [constructor](NamespaceNotFoundError.md#constructor)

### Properties

- [cause](NamespaceNotFoundError.md#cause)
- [message](NamespaceNotFoundError.md#message)
- [stack](NamespaceNotFoundError.md#stack)
- [prepareStackTrace](NamespaceNotFoundError.md#preparestacktrace)
- [stackTraceLimit](NamespaceNotFoundError.md#stacktracelimit)

### Accessors

- [name](NamespaceNotFoundError.md#name)

### Methods

- [captureStackTrace](NamespaceNotFoundError.md#capturestacktrace)

## Constructors

### constructor

• **new NamespaceNotFoundError**(`namespace`): [`NamespaceNotFoundError`](NamespaceNotFoundError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `namespace` | `string` |

#### Returns

[`NamespaceNotFoundError`](NamespaceNotFoundError.md)

#### Overrides

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
