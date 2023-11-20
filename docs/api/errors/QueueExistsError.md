>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueExistsError

# Class: QueueExistsError

## Hierarchy

- [`QueueError`](QueueError.md)

  ↳ **`QueueExistsError`**

## Table of contents

### Constructors

- [constructor](QueueExistsError.md#constructor)

### Properties

- [message](QueueExistsError.md#message)
- [stack](QueueExistsError.md#stack)
- [prepareStackTrace](QueueExistsError.md#preparestacktrace)
- [stackTraceLimit](QueueExistsError.md#stacktracelimit)

### Accessors

- [name](QueueExistsError.md#name)

### Methods

- [captureStackTrace](QueueExistsError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueExistsError**(`message?`): [`QueueExistsError`](QueueExistsError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`QueueExistsError`](QueueExistsError.md)

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
