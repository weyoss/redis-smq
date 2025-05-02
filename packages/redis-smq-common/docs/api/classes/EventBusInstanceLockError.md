[RedisSMQ Common Library](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / EventBusInstanceLockError

# Class: EventBusInstanceLockError

## Hierarchy

- [`EventBusError`](EventBusError.md)

  ↳ **`EventBusInstanceLockError`**

## Table of contents

### Constructors

- [constructor](EventBusInstanceLockError.md#constructor)

### Properties

- [cause](EventBusInstanceLockError.md#cause)
- [message](EventBusInstanceLockError.md#message)
- [stack](EventBusInstanceLockError.md#stack)
- [prepareStackTrace](EventBusInstanceLockError.md#preparestacktrace)
- [stackTraceLimit](EventBusInstanceLockError.md#stacktracelimit)

### Accessors

- [name](EventBusInstanceLockError.md#name)

### Methods

- [captureStackTrace](EventBusInstanceLockError.md#capturestacktrace)

## Constructors

### constructor

• **new EventBusInstanceLockError**(`message?`): [`EventBusInstanceLockError`](EventBusInstanceLockError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`EventBusInstanceLockError`](EventBusInstanceLockError.md)

#### Inherited from

[EventBusError](EventBusError.md).[constructor](EventBusError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

[EventBusError](EventBusError.md).[cause](EventBusError.md#cause)

___

### message

• **message**: `string`

#### Inherited from

[EventBusError](EventBusError.md).[message](EventBusError.md#message)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[EventBusError](EventBusError.md).[stack](EventBusError.md#stack)

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

[EventBusError](EventBusError.md).[prepareStackTrace](EventBusError.md#preparestacktrace)

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[EventBusError](EventBusError.md).[stackTraceLimit](EventBusError.md#stacktracelimit)

## Accessors

### name

• `get` **name**(): `string`

#### Returns

`string`

#### Inherited from

EventBusError.name

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

[EventBusError](EventBusError.md).[captureStackTrace](EventBusError.md#capturestacktrace)
