>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducerError

# Class: ProducerError

## Hierarchy

- `RedisSMQError`

  ↳ **`ProducerError`**

  ↳↳ [`ProducerMessageAlreadyPublishedError`](ProducerMessageAlreadyPublishedError.md)

  ↳↳ [`ProducerMessageNotPublishedError`](ProducerMessageNotPublishedError.md)

  ↳↳ [`ProducerMessageNotScheduledError`](ProducerMessageNotScheduledError.md)

  ↳↳ [`ProducerInstanceNotRunningError`](ProducerInstanceNotRunningError.md)

## Table of contents

### Constructors

- [constructor](ProducerError.md#constructor)

### Properties

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

• **new ProducerError**(`message?`): [`ProducerError`](ProducerError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ProducerError`](ProducerError.md)

#### Inherited from

RedisSMQError.constructor

## Properties

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
