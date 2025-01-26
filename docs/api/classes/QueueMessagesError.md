[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueMessagesError

# Class: QueueMessagesError

## Hierarchy

- `RedisSMQError`

  ↳ **`QueueMessagesError`**

  ↳↳ [`QueueMessagesConsumerGroupIdRequiredError`](QueueMessagesConsumerGroupIdRequiredError.md)

  ↳↳ [`QueueMessagesConsumerGroupIdNotSupportedError`](QueueMessagesConsumerGroupIdNotSupportedError.md)

## Table of contents

### Constructors

- [constructor](QueueMessagesError.md#constructor)

### Properties

- [cause](QueueMessagesError.md#cause)
- [message](QueueMessagesError.md#message)
- [stack](QueueMessagesError.md#stack)
- [prepareStackTrace](QueueMessagesError.md#preparestacktrace)
- [stackTraceLimit](QueueMessagesError.md#stacktracelimit)

### Accessors

- [name](QueueMessagesError.md#name)

### Methods

- [captureStackTrace](QueueMessagesError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueMessagesError**(`message?`): [`QueueMessagesError`](QueueMessagesError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`QueueMessagesError`](QueueMessagesError.md)

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
