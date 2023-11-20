>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueError

# Class: QueueError

## Hierarchy

- `RedisSMQError`

  ↳ **`QueueError`**

  ↳↳ [`QueueMessageNotFoundError`](QueueMessageNotFoundError.md)

  ↳↳ [`QueueMessageRequeueError`](QueueMessageRequeueError.md)

  ↳↳ [`QueueNamespaceNotFoundError`](QueueNamespaceNotFoundError.md)

  ↳↳ [`QueueExistsError`](QueueExistsError.md)

  ↳↳ [`QueueHasRunningConsumersError`](QueueHasRunningConsumersError.md)

  ↳↳ [`QueueNotEmptyError`](QueueNotEmptyError.md)

  ↳↳ [`QueueNotFoundError`](QueueNotFoundError.md)

  ↳↳ [`QueueRateLimitError`](QueueRateLimitError.md)

  ↳↳ [`QueueDeleteOperationError`](QueueDeleteOperationError.md)

## Table of contents

### Constructors

- [constructor](QueueError.md#constructor)

### Properties

- [message](QueueError.md#message)
- [stack](QueueError.md#stack)
- [prepareStackTrace](QueueError.md#preparestacktrace)
- [stackTraceLimit](QueueError.md#stacktracelimit)

### Accessors

- [name](QueueError.md#name)

### Methods

- [captureStackTrace](QueueError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueError**(`message?`): [`QueueError`](QueueError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`QueueError`](QueueError.md)

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
