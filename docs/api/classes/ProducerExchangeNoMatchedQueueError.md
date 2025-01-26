[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducerExchangeNoMatchedQueueError

# Class: ProducerExchangeNoMatchedQueueError

## Hierarchy

- [`ProducerError`](ProducerError.md)

  ↳ **`ProducerExchangeNoMatchedQueueError`**

## Table of contents

### Constructors

- [constructor](ProducerExchangeNoMatchedQueueError.md#constructor)

### Properties

- [cause](ProducerExchangeNoMatchedQueueError.md#cause)
- [message](ProducerExchangeNoMatchedQueueError.md#message)
- [stack](ProducerExchangeNoMatchedQueueError.md#stack)
- [prepareStackTrace](ProducerExchangeNoMatchedQueueError.md#preparestacktrace)
- [stackTraceLimit](ProducerExchangeNoMatchedQueueError.md#stacktracelimit)

### Accessors

- [name](ProducerExchangeNoMatchedQueueError.md#name)

### Methods

- [captureStackTrace](ProducerExchangeNoMatchedQueueError.md#capturestacktrace)

## Constructors

### constructor

• **new ProducerExchangeNoMatchedQueueError**(`message?`): [`ProducerExchangeNoMatchedQueueError`](ProducerExchangeNoMatchedQueueError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ProducerExchangeNoMatchedQueueError`](ProducerExchangeNoMatchedQueueError.md)

#### Inherited from

[ProducerError](ProducerError.md).[constructor](ProducerError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[ProducerError](ProducerError.md).[cause](ProducerError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[ProducerError](ProducerError.md).[message](ProducerError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[ProducerError](ProducerError.md).[stack](ProducerError.md#stack)

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

[ProducerError](ProducerError.md).[prepareStackTrace](ProducerError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[ProducerError](ProducerError.md).[stackTraceLimit](ProducerError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

ProducerError.name

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

[ProducerError](ProducerError.md).[captureStackTrace](ProducerError.md#capturestacktrace)
