>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducerInstanceNotRunningError

# Class: ProducerInstanceNotRunningError

## Hierarchy

- [`ProducerError`](ProducerError.md)

  ↳ **`ProducerInstanceNotRunningError`**

## Table of contents

### Constructors

- [constructor](ProducerInstanceNotRunningError.md#constructor)

### Properties

- [message](ProducerInstanceNotRunningError.md#message)
- [stack](ProducerInstanceNotRunningError.md#stack)
- [prepareStackTrace](ProducerInstanceNotRunningError.md#preparestacktrace)
- [stackTraceLimit](ProducerInstanceNotRunningError.md#stacktracelimit)

### Accessors

- [name](ProducerInstanceNotRunningError.md#name)

### Methods

- [captureStackTrace](ProducerInstanceNotRunningError.md#capturestacktrace)

## Constructors

### constructor

• **new ProducerInstanceNotRunningError**(`msg?`): [`ProducerInstanceNotRunningError`](ProducerInstanceNotRunningError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `msg` | `string` |

#### Returns

[`ProducerInstanceNotRunningError`](ProducerInstanceNotRunningError.md)

#### Overrides

[ProducerError](ProducerError.md).[constructor](ProducerError.md#constructor)

## Properties

### message

• **message**: `string`

#### Inherited from

[ProducerError](ProducerError.md).[message](ProducerError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[ProducerError](ProducerError.md).[stack](ProducerError.md#stack)

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

[ProducerError](ProducerError.md).[prepareStackTrace](ProducerError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[ProducerError](ProducerError.md).[stackTraceLimit](ProducerError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

ProducerError.name

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

[ProducerError](ProducerError.md).[captureStackTrace](ProducerError.md#capturestacktrace)
