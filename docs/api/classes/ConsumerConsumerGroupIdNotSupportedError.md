[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerConsumerGroupIdNotSupportedError

# Class: ConsumerConsumerGroupIdNotSupportedError

## Hierarchy

- [`ConsumerError`](ConsumerError.md)

  ↳ **`ConsumerConsumerGroupIdNotSupportedError`**

## Table of contents

### Constructors

- [constructor](ConsumerConsumerGroupIdNotSupportedError.md#constructor)

### Properties

- [cause](ConsumerConsumerGroupIdNotSupportedError.md#cause)
- [message](ConsumerConsumerGroupIdNotSupportedError.md#message)
- [stack](ConsumerConsumerGroupIdNotSupportedError.md#stack)
- [prepareStackTrace](ConsumerConsumerGroupIdNotSupportedError.md#preparestacktrace)
- [stackTraceLimit](ConsumerConsumerGroupIdNotSupportedError.md#stacktracelimit)

### Accessors

- [name](ConsumerConsumerGroupIdNotSupportedError.md#name)

### Methods

- [captureStackTrace](ConsumerConsumerGroupIdNotSupportedError.md#capturestacktrace)

## Constructors

### constructor

• **new ConsumerConsumerGroupIdNotSupportedError**(`message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Inherited from

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

▸ `Static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

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
