[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducerUnknownQueueTypeError

# Class: ProducerUnknownQueueTypeError

## Hierarchy

- [`ProducerError`](ProducerError.md)

  ↳ **`ProducerUnknownQueueTypeError`**

## Table of contents

### Constructors

- [constructor](ProducerUnknownQueueTypeError.md#constructor)

### Properties

- [cause](ProducerUnknownQueueTypeError.md#cause)
- [message](ProducerUnknownQueueTypeError.md#message)
- [stack](ProducerUnknownQueueTypeError.md#stack)
- [prepareStackTrace](ProducerUnknownQueueTypeError.md#preparestacktrace)
- [stackTraceLimit](ProducerUnknownQueueTypeError.md#stacktracelimit)

### Accessors

- [name](ProducerUnknownQueueTypeError.md#name)

### Methods

- [captureStackTrace](ProducerUnknownQueueTypeError.md#capturestacktrace)

## Constructors

### constructor

• **new ProducerUnknownQueueTypeError**(`message?`): [`ProducerUnknownQueueTypeError`](ProducerUnknownQueueTypeError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ProducerUnknownQueueTypeError`](ProducerUnknownQueueTypeError.md)

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
