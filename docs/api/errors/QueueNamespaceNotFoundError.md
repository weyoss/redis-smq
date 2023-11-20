>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueNamespaceNotFoundError

# Class: QueueNamespaceNotFoundError

## Hierarchy

- [`QueueError`](QueueError.md)

  ↳ **`QueueNamespaceNotFoundError`**

## Table of contents

### Constructors

- [constructor](QueueNamespaceNotFoundError.md#constructor)

### Properties

- [message](QueueNamespaceNotFoundError.md#message)
- [stack](QueueNamespaceNotFoundError.md#stack)
- [prepareStackTrace](QueueNamespaceNotFoundError.md#preparestacktrace)
- [stackTraceLimit](QueueNamespaceNotFoundError.md#stacktracelimit)

### Accessors

- [name](QueueNamespaceNotFoundError.md#name)

### Methods

- [captureStackTrace](QueueNamespaceNotFoundError.md#capturestacktrace)

## Constructors

### constructor

• **new QueueNamespaceNotFoundError**(`namespace`): [`QueueNamespaceNotFoundError`](QueueNamespaceNotFoundError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `namespace` | `string` |

#### Returns

[`QueueNamespaceNotFoundError`](QueueNamespaceNotFoundError.md)

#### Overrides

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
