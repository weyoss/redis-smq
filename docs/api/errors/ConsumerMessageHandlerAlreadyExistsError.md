>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerMessageHandlerAlreadyExistsError

# Class: ConsumerMessageHandlerAlreadyExistsError

## Hierarchy

- [`ConsumerError`](ConsumerError.md)

  ↳ **`ConsumerMessageHandlerAlreadyExistsError`**

## Table of contents

### Constructors

- [constructor](ConsumerMessageHandlerAlreadyExistsError.md#constructor)

### Properties

- [message](ConsumerMessageHandlerAlreadyExistsError.md#message)
- [stack](ConsumerMessageHandlerAlreadyExistsError.md#stack)
- [prepareStackTrace](ConsumerMessageHandlerAlreadyExistsError.md#preparestacktrace)
- [stackTraceLimit](ConsumerMessageHandlerAlreadyExistsError.md#stacktracelimit)

### Accessors

- [name](ConsumerMessageHandlerAlreadyExistsError.md#name)

### Methods

- [captureStackTrace](ConsumerMessageHandlerAlreadyExistsError.md#capturestacktrace)

## Constructors

### constructor

• **new ConsumerMessageHandlerAlreadyExistsError**(`queue`): [`ConsumerMessageHandlerAlreadyExistsError`](ConsumerMessageHandlerAlreadyExistsError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | [`IQueueParams`](../../../doc2/interfaces/IQueueParams.md) |

#### Returns

[`ConsumerMessageHandlerAlreadyExistsError`](ConsumerMessageHandlerAlreadyExistsError.md)

#### Overrides

[ConsumerError](ConsumerError.md).[constructor](ConsumerError.md#constructor)

## Properties

### message

• **message**: `string`

#### Inherited from

[ConsumerError](ConsumerError.md).[message](ConsumerError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[ConsumerError](ConsumerError.md).[stack](ConsumerError.md#stack)

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

[ConsumerError](ConsumerError.md).[prepareStackTrace](ConsumerError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[ConsumerError](ConsumerError.md).[stackTraceLimit](ConsumerError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

ConsumerError.name

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

[ConsumerError](ConsumerError.md).[captureStackTrace](ConsumerError.md#capturestacktrace)
