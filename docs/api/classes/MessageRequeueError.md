[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / MessageRequeueError

# Class: MessageRequeueError

## Hierarchy

- [`QueueMessageError`](QueueMessageError.md)

  ↳ **`MessageRequeueError`**

## Table of contents

### Constructors

- [constructor](MessageRequeueError.md#constructor)

### Properties

- [cause](MessageRequeueError.md#cause)
- [message](MessageRequeueError.md#message)
- [stack](MessageRequeueError.md#stack)
- [prepareStackTrace](MessageRequeueError.md#preparestacktrace)
- [stackTraceLimit](MessageRequeueError.md#stacktracelimit)

### Accessors

- [name](MessageRequeueError.md#name)

### Methods

- [captureStackTrace](MessageRequeueError.md#capturestacktrace)

## Constructors

### constructor

• **new MessageRequeueError**(`msg?`): [`MessageRequeueError`](MessageRequeueError.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `msg` | `string` | `'MESSAGE_REQUEUE_ERROR'` |

#### Returns

[`MessageRequeueError`](MessageRequeueError.md)

#### Overrides

[QueueMessageError](QueueMessageError.md).[constructor](QueueMessageError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[QueueMessageError](QueueMessageError.md).[cause](QueueMessageError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[QueueMessageError](QueueMessageError.md).[message](QueueMessageError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[QueueMessageError](QueueMessageError.md).[stack](QueueMessageError.md#stack)

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

[QueueMessageError](QueueMessageError.md).[prepareStackTrace](QueueMessageError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[QueueMessageError](QueueMessageError.md).[stackTraceLimit](QueueMessageError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

QueueMessageError.name

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

[QueueMessageError](QueueMessageError.md).[captureStackTrace](QueueMessageError.md#capturestacktrace)
