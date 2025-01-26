[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerGroupsInvalidGroupIdError

# Class: ConsumerGroupsInvalidGroupIdError

## Hierarchy

- [`ConsumerGroupsError`](ConsumerGroupsError.md)

  ↳ **`ConsumerGroupsInvalidGroupIdError`**

## Table of contents

### Constructors

- [constructor](ConsumerGroupsInvalidGroupIdError.md#constructor)

### Properties

- [cause](ConsumerGroupsInvalidGroupIdError.md#cause)
- [message](ConsumerGroupsInvalidGroupIdError.md#message)
- [stack](ConsumerGroupsInvalidGroupIdError.md#stack)
- [prepareStackTrace](ConsumerGroupsInvalidGroupIdError.md#preparestacktrace)
- [stackTraceLimit](ConsumerGroupsInvalidGroupIdError.md#stacktracelimit)

### Accessors

- [name](ConsumerGroupsInvalidGroupIdError.md#name)

### Methods

- [captureStackTrace](ConsumerGroupsInvalidGroupIdError.md#capturestacktrace)

## Constructors

### constructor

• **new ConsumerGroupsInvalidGroupIdError**(`message?`): [`ConsumerGroupsInvalidGroupIdError`](ConsumerGroupsInvalidGroupIdError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ConsumerGroupsInvalidGroupIdError`](ConsumerGroupsInvalidGroupIdError.md)

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
