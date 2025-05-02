[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / AsyncCallbackTimeoutError

# Class: AsyncCallbackTimeoutError

## Hierarchy

- [`RedisSMQError`](RedisSMQError.md)

  ↳ **`AsyncCallbackTimeoutError`**

## Table of contents

### Constructors

- [constructor](AsyncCallbackTimeoutError.md#constructor)

### Properties

- [cause](AsyncCallbackTimeoutError.md#cause)
- [message](AsyncCallbackTimeoutError.md#message)
- [stack](AsyncCallbackTimeoutError.md#stack)
- [prepareStackTrace](AsyncCallbackTimeoutError.md#preparestacktrace)
- [stackTraceLimit](AsyncCallbackTimeoutError.md#stacktracelimit)

### Accessors

- [name](AsyncCallbackTimeoutError.md#name)

### Methods

- [captureStackTrace](AsyncCallbackTimeoutError.md#capturestacktrace)

## Constructors

### constructor

• **new AsyncCallbackTimeoutError**(): [`AsyncCallbackTimeoutError`](AsyncCallbackTimeoutError.md)

#### Returns

[`AsyncCallbackTimeoutError`](AsyncCallbackTimeoutError.md)

#### Overrides

[RedisSMQError](RedisSMQError.md).[constructor](RedisSMQError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[RedisSMQError](RedisSMQError.md).[cause](RedisSMQError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[RedisSMQError](RedisSMQError.md).[message](RedisSMQError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[RedisSMQError](RedisSMQError.md).[stack](RedisSMQError.md#stack)

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

[RedisSMQError](RedisSMQError.md).[prepareStackTrace](RedisSMQError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[RedisSMQError](RedisSMQError.md).[stackTraceLimit](RedisSMQError.md#stacktracelimit)

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

[RedisSMQError](RedisSMQError.md).[captureStackTrace](RedisSMQError.md#capturestacktrace)
