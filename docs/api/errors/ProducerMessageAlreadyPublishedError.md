>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducerMessageAlreadyPublishedError

# Class: ProducerMessageAlreadyPublishedError

## Hierarchy

- [`ProducerError`](ProducerError.md)

  ↳ **`ProducerMessageAlreadyPublishedError`**

## Table of contents

### Constructors

- [constructor](ProducerMessageAlreadyPublishedError.md#constructor)

### Properties

- [message](ProducerMessageAlreadyPublishedError.md#message)
- [stack](ProducerMessageAlreadyPublishedError.md#stack)
- [prepareStackTrace](ProducerMessageAlreadyPublishedError.md#preparestacktrace)
- [stackTraceLimit](ProducerMessageAlreadyPublishedError.md#stacktracelimit)

### Accessors

- [name](ProducerMessageAlreadyPublishedError.md#name)

### Methods

- [captureStackTrace](ProducerMessageAlreadyPublishedError.md#capturestacktrace)

## Constructors

### constructor

• **new ProducerMessageAlreadyPublishedError**(`msg?`): [`ProducerMessageAlreadyPublishedError`](ProducerMessageAlreadyPublishedError.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `msg` | `string` | `'The message can not published. Either you have already published the message or you have called the getSetMessageState() method.'` |

#### Returns

[`ProducerMessageAlreadyPublishedError`](ProducerMessageAlreadyPublishedError.md)

#### Overrides

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
