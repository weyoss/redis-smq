[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConfigurationMessageStoreExpireError

# Class: ConfigurationMessageStoreExpireError

## Hierarchy

- [`ConfigurationError`](ConfigurationError.md)

  ↳ **`ConfigurationMessageStoreExpireError`**

## Table of contents

### Constructors

- [constructor](ConfigurationMessageStoreExpireError.md#constructor)

### Properties

- [cause](ConfigurationMessageStoreExpireError.md#cause)
- [message](ConfigurationMessageStoreExpireError.md#message)
- [stack](ConfigurationMessageStoreExpireError.md#stack)
- [prepareStackTrace](ConfigurationMessageStoreExpireError.md#preparestacktrace)
- [stackTraceLimit](ConfigurationMessageStoreExpireError.md#stacktracelimit)

### Accessors

- [name](ConfigurationMessageStoreExpireError.md#name)

### Methods

- [captureStackTrace](ConfigurationMessageStoreExpireError.md#capturestacktrace)

## Constructors

### constructor

• **new ConfigurationMessageStoreExpireError**(`message?`): [`ConfigurationMessageStoreExpireError`](ConfigurationMessageStoreExpireError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`ConfigurationMessageStoreExpireError`](ConfigurationMessageStoreExpireError.md)

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

[ConfigurationError](ConfigurationError.md).[captureStackTrace](ConfigurationError.md#capturestacktrace)
