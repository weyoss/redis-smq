[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueMessageError

# Class: QueueMessageError

## Hierarchy

- `RedisSMQError`

  ↳ **`QueueMessageError`**

  ↳↳ [`MessageRequeueError`](MessageRequeueError.md)

## Table of contents

### Constructors

- [constructor](QueueMessageError.md#constructor)

### Properties

- [cause](QueueMessageError.md#cause)
- [message](QueueMessageError.md#message)
- [stack](QueueMessageError.md#stack)
- [prepareStackTrace](QueueMessageError.md#preparestacktrace)
- [stackTraceLimit](QueueMessageError.md#stacktracelimit)

### Accessors

- [name](QueueMessageError.md#name)

### Methods

- [captureStackTrace](QueueMessageError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueMessageError**(`message?`): [`QueueMessageError`](QueueMessageError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`QueueMessageError`](QueueMessageError.md)

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
