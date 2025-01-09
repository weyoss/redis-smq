[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConfigurationMessageQueueSizeError

# Class: ConfigurationMessageQueueSizeError

## Hierarchy

- [`ConfigurationError`](ConfigurationError.md)

  ↳ **`ConfigurationMessageQueueSizeError`**

## Table of contents

### Constructors

- [constructor](ConfigurationMessageQueueSizeError.md#constructor)

### Properties

- [cause](ConfigurationMessageQueueSizeError.md#cause)
- [message](ConfigurationMessageQueueSizeError.md#message)
- [stack](ConfigurationMessageQueueSizeError.md#stack)
- [prepareStackTrace](ConfigurationMessageQueueSizeError.md#preparestacktrace)
- [stackTraceLimit](ConfigurationMessageQueueSizeError.md#stacktracelimit)

### Accessors

- [name](ConfigurationMessageQueueSizeError.md#name)

### Methods

- [captureStackTrace](ConfigurationMessageQueueSizeError.md#capturestacktrace)

## Constructors

### constructor

• **new ConfigurationMessageQueueSizeError**(`message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Inherited from

[ConfigurationError](ConfigurationError.md).[constructor](ConfigurationError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[ConfigurationError](ConfigurationError.md).[cause](ConfigurationError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[ConfigurationError](ConfigurationError.md).[message](ConfigurationError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[ConfigurationError](ConfigurationError.md).[stack](ConfigurationError.md#stack)

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

[ConfigurationError](ConfigurationError.md).[prepareStackTrace](ConfigurationError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[ConfigurationError](ConfigurationError.md).[stackTraceLimit](ConfigurationError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

ConfigurationError.name

## Methods

### captureStackTrace

▸ `Static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

[ConfigurationError](ConfigurationError.md).[captureStackTrace](ConfigurationError.md#capturestacktrace)
