>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducerMessageNotScheduledError

# Class: ProducerMessageNotScheduledError

## Hierarchy

- [`ProducerError`](ProducerError.md)

  ↳ **`ProducerMessageNotScheduledError`**

## Table of contents

### Constructors

- [constructor](ProducerMessageNotScheduledError.md#constructor)

### Properties

- [message](ProducerMessageNotScheduledError.md#message)
- [stack](ProducerMessageNotScheduledError.md#stack)
- [prepareStackTrace](ProducerMessageNotScheduledError.md#preparestacktrace)
- [stackTraceLimit](ProducerMessageNotScheduledError.md#stacktracelimit)

### Accessors

- [name](ProducerMessageNotScheduledError.md#name)

### Methods

- [captureStackTrace](ProducerMessageNotScheduledError.md#capturestacktrace)

## Constructors

### constructor

• **new ProducerMessageNotScheduledError**(`message?`): [`ProducerMessageNotScheduledError`](ProducerMessageNotScheduledError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ProducerMessageNotScheduledError`](ProducerMessageNotScheduledError.md)

#### Inherited from

[ProducerError](ProducerError.md).[constructor](ProducerError.md#constructor)

## Properties

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
