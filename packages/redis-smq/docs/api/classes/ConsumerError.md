[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerError

# Class: ConsumerError

## Hierarchy

- `RedisSMQError`

  ↳ **`ConsumerError`**

  ↳↳ [`ConsumerConsumeMessageHandlerAlreadyExistsError`](ConsumerConsumeMessageHandlerAlreadyExistsError.md)

  ↳↳ [`ConsumerConsumerGroupIdNotSupportedError`](ConsumerConsumerGroupIdNotSupportedError.md)

  ↳↳ [`ConsumerConsumerGroupIdRequiredError`](ConsumerConsumerGroupIdRequiredError.md)

## Table of contents

### Constructors

- [constructor](ConsumerError.md#constructor)

### Properties

- [cause](ConsumerError.md#cause)
- [message](ConsumerError.md#message)
- [stack](ConsumerError.md#stack)
- [prepareStackTrace](ConsumerError.md#preparestacktrace)
- [stackTraceLimit](ConsumerError.md#stacktracelimit)

### Accessors

- [name](ConsumerError.md#name)

### Methods

- [captureStackTrace](ConsumerError.md#capturestacktrace)

## Constructors

### constructor

• **new ConsumerError**(`message?`): [`ConsumerError`](ConsumerError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ConsumerError`](ConsumerError.md)

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
