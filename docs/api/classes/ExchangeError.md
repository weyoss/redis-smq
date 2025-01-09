[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeError

# Class: ExchangeError

## Hierarchy

- `RedisSMQError`

  ↳ **`ExchangeError`**

  ↳↳ [`ExchangeFanOutError`](ExchangeFanOutError.md)

  ↳↳ [`ExchangeInvalidTopicParamsError`](ExchangeInvalidTopicParamsError.md)

  ↳↳ [`ExchangeInvalidFanOutParamsError`](ExchangeInvalidFanOutParamsError.md)

  ↳↳ [`ExchangeInvalidQueueParamsError`](ExchangeInvalidQueueParamsError.md)

  ↳↳ [`ExchangeFanOutExchangeHasBoundQueuesError`](ExchangeFanOutExchangeHasBoundQueuesError.md)

  ↳↳ [`ExchangeQueueIsNotBoundToExchangeError`](ExchangeQueueIsNotBoundToExchangeError.md)

## Table of contents

### Constructors

- [constructor](ExchangeError.md#constructor)

### Properties

- [cause](ExchangeError.md#cause)
- [message](ExchangeError.md#message)
- [stack](ExchangeError.md#stack)
- [prepareStackTrace](ExchangeError.md#preparestacktrace)
- [stackTraceLimit](ExchangeError.md#stacktracelimit)

### Accessors

- [name](ExchangeError.md#name)

### Methods

- [captureStackTrace](ExchangeError.md#capturestacktrace)

## Constructors

### constructor

• **new ExchangeError**(`message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

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

RedisSMQError.captureStackTrace
