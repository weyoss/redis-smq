[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConfigurationError

# Class: ConfigurationError

## Hierarchy

- `RedisSMQError`

  ↳ **`ConfigurationError`**

  ↳↳ [`ConfigurationMessageStoreExpireError`](ConfigurationMessageStoreExpireError.md)

  ↳↳ [`ConfigurationMessageQueueSizeError`](ConfigurationMessageQueueSizeError.md)

  ↳↳ [`ConfigurationNamespaceError`](ConfigurationNamespaceError.md)

## Table of contents

### Constructors

- [constructor](ConfigurationError.md#constructor)

### Properties

- [cause](ConfigurationError.md#cause)
- [message](ConfigurationError.md#message)
- [stack](ConfigurationError.md#stack)
- [prepareStackTrace](ConfigurationError.md#preparestacktrace)
- [stackTraceLimit](ConfigurationError.md#stacktracelimit)

### Accessors

- [name](ConfigurationError.md#name)

### Methods

- [captureStackTrace](ConfigurationError.md#capturestacktrace)

## Constructors

### constructor

• **new ConfigurationError**(`message?`): [`ConfigurationError`](ConfigurationError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ConfigurationError`](ConfigurationError.md)

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

Optional override for formatting stack traces

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Type declaration

▸ (`err`, `stackTraces`): `any`

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

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
