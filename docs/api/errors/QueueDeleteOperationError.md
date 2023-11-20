>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueDeleteOperationError

# Class: QueueDeleteOperationError

## Hierarchy

- [`QueueError`](QueueError.md)

  ↳ **`QueueDeleteOperationError`**

## Table of contents

### Constructors

- [constructor](QueueDeleteOperationError.md#constructor)

### Properties

- [message](QueueDeleteOperationError.md#message)
- [stack](QueueDeleteOperationError.md#stack)
- [prepareStackTrace](QueueDeleteOperationError.md#preparestacktrace)
- [stackTraceLimit](QueueDeleteOperationError.md#stacktracelimit)

### Accessors

- [name](QueueDeleteOperationError.md#name)

### Methods

- [captureStackTrace](QueueDeleteOperationError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueDeleteOperationError**(`message?`): [`QueueDeleteOperationError`](QueueDeleteOperationError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`QueueDeleteOperationError`](QueueDeleteOperationError.md)

#### Inherited from

[QueueError](QueueError.md).[constructor](QueueError.md#constructor)

## Properties

### message

• **message**: `string`

#### Inherited from

[QueueError](QueueError.md).[message](QueueError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[QueueError](QueueError.md).[stack](QueueError.md#stack)

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

[QueueError](QueueError.md).[prepareStackTrace](QueueError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[QueueError](QueueError.md).[stackTraceLimit](QueueError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

QueueError.name

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

[QueueError](QueueError.md).[captureStackTrace](QueueError.md#capturestacktrace)
