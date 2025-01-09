[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerGroupsConsumerGroupNotEmptyError

# Class: ConsumerGroupsConsumerGroupNotEmptyError

## Hierarchy

- [`ConsumerGroupsError`](ConsumerGroupsError.md)

  ↳ **`ConsumerGroupsConsumerGroupNotEmptyError`**

## Table of contents

### Constructors

- [constructor](ConsumerGroupsConsumerGroupNotEmptyError.md#constructor)

### Properties

- [cause](ConsumerGroupsConsumerGroupNotEmptyError.md#cause)
- [message](ConsumerGroupsConsumerGroupNotEmptyError.md#message)
- [stack](ConsumerGroupsConsumerGroupNotEmptyError.md#stack)
- [prepareStackTrace](ConsumerGroupsConsumerGroupNotEmptyError.md#preparestacktrace)
- [stackTraceLimit](ConsumerGroupsConsumerGroupNotEmptyError.md#stacktracelimit)

### Accessors

- [name](ConsumerGroupsConsumerGroupNotEmptyError.md#name)

### Methods

- [captureStackTrace](ConsumerGroupsConsumerGroupNotEmptyError.md#capturestacktrace)

## Constructors

### constructor

• **new ConsumerGroupsConsumerGroupNotEmptyError**(`message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

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

[ConsumerGroupsError](ConsumerGroupsError.md).[captureStackTrace](ConsumerGroupsError.md#capturestacktrace)
