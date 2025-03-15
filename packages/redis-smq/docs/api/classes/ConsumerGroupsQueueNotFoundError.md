[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerGroupsQueueNotFoundError

# Class: ConsumerGroupsQueueNotFoundError

## Hierarchy

- [`ConsumerGroupsError`](ConsumerGroupsError.md)

  ↳ **`ConsumerGroupsQueueNotFoundError`**

## Table of contents

### Constructors

- [constructor](ConsumerGroupsQueueNotFoundError.md#constructor)

### Properties

- [cause](ConsumerGroupsQueueNotFoundError.md#cause)
- [message](ConsumerGroupsQueueNotFoundError.md#message)
- [stack](ConsumerGroupsQueueNotFoundError.md#stack)
- [prepareStackTrace](ConsumerGroupsQueueNotFoundError.md#preparestacktrace)
- [stackTraceLimit](ConsumerGroupsQueueNotFoundError.md#stacktracelimit)

### Accessors

- [name](ConsumerGroupsQueueNotFoundError.md#name)

### Methods

- [captureStackTrace](ConsumerGroupsQueueNotFoundError.md#capturestacktrace)

## Constructors

### constructor

• **new ConsumerGroupsQueueNotFoundError**(`message?`): [`ConsumerGroupsQueueNotFoundError`](ConsumerGroupsQueueNotFoundError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ConsumerGroupsQueueNotFoundError`](ConsumerGroupsQueueNotFoundError.md)

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
