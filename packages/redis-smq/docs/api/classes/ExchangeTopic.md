[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeTopic

# Class: ExchangeTopic

## Extends

- `ExchangeAbstract`\<`string` \| [`ITopicParams`](../interfaces/ITopicParams.md)\>

## Constructors

### Constructor

> **new ExchangeTopic**(): `ExchangeTopic`

#### Returns

`ExchangeTopic`

#### Overrides

ExchangeAbstract\<string \| ITopicParams\>.constructor

## Methods

### getQueues()

> **getQueues**(`exchangeParams`, `cb`): `void`

#### Parameters

##### exchangeParams

`string` | [`ITopicParams`](../interfaces/ITopicParams.md)

##### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

#### Returns

`void`

#### Overrides

`ExchangeAbstract.getQueues`

***

### shutdown()

> **shutdown**(`cb`): `void`

#### Parameters

##### cb

`ICallback`\<`void`\>

#### Returns

`void`

#### Inherited from

`ExchangeAbstract.shutdown`
