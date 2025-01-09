[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeTopic

# Class: ExchangeTopic

## Hierarchy

- `ExchangeAbstract`\<`string` \| [`ITopicParams`](../interfaces/ITopicParams.md)\>

  ↳ **`ExchangeTopic`**

## Table of contents

### Constructors

- [constructor](ExchangeTopic.md#constructor)

### Methods

- [getQueues](ExchangeTopic.md#getqueues)
- [shutdown](ExchangeTopic.md#shutdown)

## Constructors

### constructor

• **new ExchangeTopic**()

#### Inherited from

ExchangeAbstract\<string \| ITopicParams\>.constructor

## Methods

### getQueues

▸ **getQueues**(`exchangeParams`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `exchangeParams` | `string` \| [`ITopicParams`](../interfaces/ITopicParams.md) |
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
