[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerGroupsConsumerGroupsNotSupportedError

# Class: ConsumerGroupsConsumerGroupsNotSupportedError

## Hierarchy

- [`ConsumerGroupsError`](ConsumerGroupsError.md)

  ↳ **`ConsumerGroupsConsumerGroupsNotSupportedError`**

## Table of contents

### Constructors

- [constructor](ConsumerGroupsConsumerGroupsNotSupportedError.md#constructor)

### Properties

- [cause](ConsumerGroupsConsumerGroupsNotSupportedError.md#cause)
- [message](ConsumerGroupsConsumerGroupsNotSupportedError.md#message)
- [stack](ConsumerGroupsConsumerGroupsNotSupportedError.md#stack)
- [prepareStackTrace](ConsumerGroupsConsumerGroupsNotSupportedError.md#preparestacktrace)
- [stackTraceLimit](ConsumerGroupsConsumerGroupsNotSupportedError.md#stacktracelimit)

### Accessors

- [name](ConsumerGroupsConsumerGroupsNotSupportedError.md#name)

### Methods

- [captureStackTrace](ConsumerGroupsConsumerGroupsNotSupportedError.md#capturestacktrace)

## Constructors

### constructor

• **new ConsumerGroupsConsumerGroupsNotSupportedError**(`message?`): [`ConsumerGroupsConsumerGroupsNotSupportedError`](ConsumerGroupsConsumerGroupsNotSupportedError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ConsumerGroupsConsumerGroupsNotSupportedError`](ConsumerGroupsConsumerGroupsNotSupportedError.md)

#### Inherited from

[ConsumerGroupsError](ConsumerGroupsError.md).[constructor](ConsumerGroupsError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[ConsumerGroupsError](ConsumerGroupsError.md).[cause](ConsumerGroupsError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[ConsumerGroupsError](ConsumerGroupsError.md).[message](ConsumerGroupsError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[ConsumerGroupsError](ConsumerGroupsError.md).[stack](ConsumerGroupsError.md#stack)

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

[ConsumerGroupsError](ConsumerGroupsError.md).[prepareStackTrace](ConsumerGroupsError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[ConsumerGroupsError](ConsumerGroupsError.md).[stackTraceLimit](ConsumerGroupsError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

ConsumerGroupsError.name

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

[ConsumerGroupsError](ConsumerGroupsError.md).[captureStackTrace](ConsumerGroupsError.md#capturestacktrace)
