[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerGroupsError

# Class: ConsumerGroupsError

## Hierarchy

- `RedisSMQError`

  ↳ **`ConsumerGroupsError`**

  ↳↳ [`ConsumerGroupsQueueNotFoundError`](ConsumerGroupsQueueNotFoundError.md)

  ↳↳ [`ConsumerGroupsConsumerGroupNotEmptyError`](ConsumerGroupsConsumerGroupNotEmptyError.md)

  ↳↳ [`ConsumerGroupsInvalidGroupIdError`](ConsumerGroupsInvalidGroupIdError.md)

  ↳↳ [`ConsumerGroupsConsumerGroupsNotSupportedError`](ConsumerGroupsConsumerGroupsNotSupportedError.md)

## Table of contents

### Constructors

- [constructor](ConsumerGroupsError.md#constructor)

### Properties

- [cause](ConsumerGroupsError.md#cause)
- [message](ConsumerGroupsError.md#message)
- [stack](ConsumerGroupsError.md#stack)
- [prepareStackTrace](ConsumerGroupsError.md#preparestacktrace)
- [stackTraceLimit](ConsumerGroupsError.md#stacktracelimit)

### Accessors

- [name](ConsumerGroupsError.md#name)

### Methods

- [captureStackTrace](ConsumerGroupsError.md#capturestacktrace)

## Constructors

### constructor

• **new ConsumerGroupsError**(`message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

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

RedisSMQError.captureStackTrace
