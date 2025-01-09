[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducerError

# Class: ProducerError

## Hierarchy

- `RedisSMQError`

  ↳ **`ProducerError`**

  ↳↳ [`ProducerInstanceNotRunningError`](ProducerInstanceNotRunningError.md)

  ↳↳ [`ProducerQueueMissingConsumerGroupsError`](ProducerQueueMissingConsumerGroupsError.md)

  ↳↳ [`ProducerMessageExchangeRequiredError`](ProducerMessageExchangeRequiredError.md)

  ↳↳ [`ProducerQueueNotFoundError`](ProducerQueueNotFoundError.md)

  ↳↳ [`ProducerMessagePriorityRequiredError`](ProducerMessagePriorityRequiredError.md)

  ↳↳ [`ProducerPriorityQueuingNotEnabledError`](ProducerPriorityQueuingNotEnabledError.md)

  ↳↳ [`ProducerUnknownQueueTypeError`](ProducerUnknownQueueTypeError.md)

  ↳↳ [`ProducerExchangeNoMatchedQueueError`](ProducerExchangeNoMatchedQueueError.md)

  ↳↳ [`ProducerScheduleInvalidParametersError`](ProducerScheduleInvalidParametersError.md)

## Table of contents

### Constructors

- [constructor](ProducerError.md#constructor)

### Properties

- [cause](ProducerError.md#cause)
- [message](ProducerError.md#message)
- [stack](ProducerError.md#stack)
- [prepareStackTrace](ProducerError.md#preparestacktrace)
- [stackTraceLimit](ProducerError.md#stacktracelimit)

### Accessors

- [name](ProducerError.md#name)

### Methods

- [captureStackTrace](ProducerError.md#capturestacktrace)

## Constructors

### constructor

• **new ProducerError**(`message?`)

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
