[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerInvalidGroupIdError

# Class: ConsumerInvalidGroupIdError

## Hierarchy

- [`ConsumerError`](ConsumerError.md)

  ↳ **`ConsumerInvalidGroupIdError`**

## Table of contents

### Constructors

- [constructor](ConsumerInvalidGroupIdError.md#constructor)

### Properties

- [cause](ConsumerInvalidGroupIdError.md#cause)
- [message](ConsumerInvalidGroupIdError.md#message)
- [stack](ConsumerInvalidGroupIdError.md#stack)
- [prepareStackTrace](ConsumerInvalidGroupIdError.md#preparestacktrace)
- [stackTraceLimit](ConsumerInvalidGroupIdError.md#stacktracelimit)

### Accessors

- [name](ConsumerInvalidGroupIdError.md#name)

### Methods

- [captureStackTrace](ConsumerInvalidGroupIdError.md#capturestacktrace)

## Constructors

### constructor

• **new ConsumerInvalidGroupIdError**(): [`ConsumerInvalidGroupIdError`](ConsumerInvalidGroupIdError.md)

#### Returns

[`ConsumerInvalidGroupIdError`](ConsumerInvalidGroupIdError.md)

#### Overrides

[ConsumerError](ConsumerError.md).[constructor](ConsumerError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[ConsumerError](ConsumerError.md).[cause](ConsumerError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[ConsumerError](ConsumerError.md).[message](ConsumerError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[ConsumerError](ConsumerError.md).[stack](ConsumerError.md#stack)

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

[ConsumerError](ConsumerError.md).[prepareStackTrace](ConsumerError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[ConsumerError](ConsumerError.md).[stackTraceLimit](ConsumerError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

ConsumerError.name

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

[ConsumerError](ConsumerError.md).[captureStackTrace](ConsumerError.md#capturestacktrace)
