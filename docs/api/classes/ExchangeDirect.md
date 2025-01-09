[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeDirect

# Class: ExchangeDirect

## Hierarchy

- `ExchangeAbstract`\<`string` \| [`IQueueParams`](../interfaces/IQueueParams.md)\>

  ↳ **`ExchangeDirect`**

## Table of contents

### Constructors

- [constructor](ExchangeDirect.md#constructor)

### Methods

- [getQueues](ExchangeDirect.md#getqueues)
- [shutdown](ExchangeDirect.md#shutdown)

## Constructors

### constructor

• **new ExchangeDirect**()

#### Inherited from

ExchangeAbstract\<string \| IQueueParams\>.constructor

## Methods

### getQueues

▸ **getQueues**(`exchangeParams`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `exchangeParams` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\> |

#### Returns

`void`

#### Overrides

ExchangeAbstract.getQueues

___

### shutdown

▸ **shutdown**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

#### Inherited from

ExchangeAbstract.shutdown
