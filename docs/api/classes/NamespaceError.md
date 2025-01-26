[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / NamespaceError

# Class: NamespaceError

## Hierarchy

- `RedisSMQError`

  ↳ **`NamespaceError`**

  ↳↳ [`NamespaceNotFoundError`](NamespaceNotFoundError.md)

  ↳↳ [`NamespaceInvalidNamespaceError`](NamespaceInvalidNamespaceError.md)

## Table of contents

### Constructors

- [constructor](NamespaceError.md#constructor)

### Properties

- [cause](NamespaceError.md#cause)
- [message](NamespaceError.md#message)
- [stack](NamespaceError.md#stack)
- [prepareStackTrace](NamespaceError.md#preparestacktrace)
- [stackTraceLimit](NamespaceError.md#stacktracelimit)

### Accessors

- [name](NamespaceError.md#name)

### Methods

- [captureStackTrace](NamespaceError.md#capturestacktrace)

## Constructors

### constructor

• **new NamespaceError**(`message?`): [`NamespaceError`](NamespaceError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`NamespaceError`](NamespaceError.md)

#### Inherited from

RedisSMQError.constructor

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

RedisSMQError.cause

___

### message

• **message**: `string`

#### Inherited from

RedisSMQError.message

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

RedisSMQError.stack

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

RedisSMQError.prepareStackTrace

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

RedisSMQError.stackTraceLimit

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

RedisSMQError.name

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

RedisSMQError.captureStackTrace
