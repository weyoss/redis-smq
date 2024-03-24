[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducerMessageNotPublishedError

# Class: ProducerMessageNotPublishedError

## Hierarchy

- [`ProducerError`](ProducerError.md)

  ↳ **`ProducerMessageNotPublishedError`**

## Table of contents

### Constructors

- [constructor](ProducerMessageNotPublishedError.md#constructor)

### Properties

- [cause](ProducerMessageNotPublishedError.md#cause)
- [message](ProducerMessageNotPublishedError.md#message)
- [stack](ProducerMessageNotPublishedError.md#stack)
- [prepareStackTrace](ProducerMessageNotPublishedError.md#preparestacktrace)
- [stackTraceLimit](ProducerMessageNotPublishedError.md#stacktracelimit)

### Accessors

- [name](ProducerMessageNotPublishedError.md#name)

### Methods

- [captureStackTrace](ProducerMessageNotPublishedError.md#capturestacktrace)

## Constructors

### constructor

• **new ProducerMessageNotPublishedError**(`message?`): [`ProducerMessageNotPublishedError`](ProducerMessageNotPublishedError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ProducerMessageNotPublishedError`](ProducerMessageNotPublishedError.md)

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
