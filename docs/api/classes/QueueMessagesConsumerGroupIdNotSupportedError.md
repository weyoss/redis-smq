[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueMessagesConsumerGroupIdNotSupportedError

# Class: QueueMessagesConsumerGroupIdNotSupportedError

## Hierarchy

- [`QueueMessagesError`](QueueMessagesError.md)

  ↳ **`QueueMessagesConsumerGroupIdNotSupportedError`**

## Table of contents

### Constructors

- [constructor](QueueMessagesConsumerGroupIdNotSupportedError.md#constructor)

### Properties

- [cause](QueueMessagesConsumerGroupIdNotSupportedError.md#cause)
- [message](QueueMessagesConsumerGroupIdNotSupportedError.md#message)
- [stack](QueueMessagesConsumerGroupIdNotSupportedError.md#stack)
- [prepareStackTrace](QueueMessagesConsumerGroupIdNotSupportedError.md#preparestacktrace)
- [stackTraceLimit](QueueMessagesConsumerGroupIdNotSupportedError.md#stacktracelimit)

### Accessors

- [name](QueueMessagesConsumerGroupIdNotSupportedError.md#name)

### Methods

- [captureStackTrace](QueueMessagesConsumerGroupIdNotSupportedError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueMessagesConsumerGroupIdNotSupportedError**(`message?`): [`QueueMessagesConsumerGroupIdNotSupportedError`](QueueMessagesConsumerGroupIdNotSupportedError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`QueueMessagesConsumerGroupIdNotSupportedError`](QueueMessagesConsumerGroupIdNotSupportedError.md)

#### Inherited from

[QueueMessagesError](QueueMessagesError.md).[constructor](QueueMessagesError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[QueueMessagesError](QueueMessagesError.md).[cause](QueueMessagesError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[QueueMessagesError](QueueMessagesError.md).[message](QueueMessagesError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[QueueMessagesError](QueueMessagesError.md).[stack](QueueMessagesError.md#stack)

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

[QueueMessagesError](QueueMessagesError.md).[prepareStackTrace](QueueMessagesError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[QueueMessagesError](QueueMessagesError.md).[stackTraceLimit](QueueMessagesError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

QueueMessagesError.name

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

[QueueMessagesError](QueueMessagesError.md).[captureStackTrace](QueueMessagesError.md#capturestacktrace)
