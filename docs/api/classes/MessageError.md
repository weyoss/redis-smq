[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / MessageError

# Class: MessageError

## Hierarchy

- `RedisSMQError`

  ↳ **`MessageError`**

  ↳↳ [`MessageDestinationQueueAlreadySetError`](MessageDestinationQueueAlreadySetError.md)

  ↳↳ [`MessageDestinationQueueRequiredError`](MessageDestinationQueueRequiredError.md)

  ↳↳ [`MessageExchangeRequiredError`](MessageExchangeRequiredError.md)

  ↳↳ [`MessageNotFoundError`](MessageNotFoundError.md)

  ↳↳ [`MessageDeleteError`](MessageDeleteError.md)

## Table of contents

### Constructors

- [constructor](MessageError.md#constructor)

### Properties

- [cause](MessageError.md#cause)
- [message](MessageError.md#message)
- [stack](MessageError.md#stack)
- [prepareStackTrace](MessageError.md#preparestacktrace)
- [stackTraceLimit](MessageError.md#stacktracelimit)

### Accessors

- [name](MessageError.md#name)

### Methods

- [captureStackTrace](MessageError.md#capturestacktrace)

## Constructors

### constructor

• **new MessageError**(`message?`): [`MessageError`](MessageError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`MessageError`](MessageError.md)

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
