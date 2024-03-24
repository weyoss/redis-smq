[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerGroupIdNotSupportedError

# Class: ConsumerGroupIdNotSupportedError

## Hierarchy

- [`ConsumerError`](ConsumerError.md)

  ↳ **`ConsumerGroupIdNotSupportedError`**

## Table of contents

### Constructors

- [constructor](ConsumerGroupIdNotSupportedError.md#constructor)

### Properties

- [cause](ConsumerGroupIdNotSupportedError.md#cause)
- [message](ConsumerGroupIdNotSupportedError.md#message)
- [stack](ConsumerGroupIdNotSupportedError.md#stack)
- [prepareStackTrace](ConsumerGroupIdNotSupportedError.md#preparestacktrace)
- [stackTraceLimit](ConsumerGroupIdNotSupportedError.md#stacktracelimit)

### Accessors

- [name](ConsumerGroupIdNotSupportedError.md#name)

### Methods

- [captureStackTrace](ConsumerGroupIdNotSupportedError.md#capturestacktrace)

## Constructors

### constructor

• **new ConsumerGroupIdNotSupportedError**(): [`ConsumerGroupIdNotSupportedError`](ConsumerGroupIdNotSupportedError.md)

#### Returns

[`ConsumerGroupIdNotSupportedError`](ConsumerGroupIdNotSupportedError.md)

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
