[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeTopic

# Class: ExchangeTopic

## Contents

- [Constructors](ExchangeTopic.md#constructors)
  - [new ExchangeTopic(queue)](ExchangeTopic.md#new-exchangetopicqueue)
- [Properties](ExchangeTopic.md#properties)
  - [bindingParams](ExchangeTopic.md#bindingparams)
  - [exchangeTag](ExchangeTopic.md#exchangetag)
  - [type](ExchangeTopic.md#type)
- [Methods](ExchangeTopic.md#methods)
  - [fromJSON()](ExchangeTopic.md#fromjson)
  - [getBindingParams()](ExchangeTopic.md#getbindingparams)
  - [getQueues()](ExchangeTopic.md#getqueues)
  - [toJSON()](ExchangeTopic.md#tojson)

## Constructors

### new ExchangeTopic(queue)

> **new ExchangeTopic**(`queue`): [`ExchangeTopic`](ExchangeTopic.md)

#### Parameters

▪ **queue**: [`TExchangeTopicExchangeBindingParams`](../type-aliases/TExchangeTopicExchangeBindingParams.md)

#### Returns

[`ExchangeTopic`](ExchangeTopic.md)

#### Overrides

Exchange<
  TExchangeTopicExchangeBindingParams,
  EExchangeType.TOPIC
>.constructor

## Properties

### bindingParams

> **`readonly`** **bindingParams**: [`TExchangeTopicExchangeBindingParams`](../type-aliases/TExchangeTopicExchangeBindingParams.md)

### exchangeTag

> **exchangeTag**: `string`

### type

> **`readonly`** **type**: [`TOPIC`](../enumerations/EExchangeType.md#topic)

## Methods

### fromJSON()

> **fromJSON**(`JSON`): `void`

#### Parameters

▪ **JSON**: `Partial`<[`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)<[`TExchangeTopicExchangeBindingParams`](../type-aliases/TExchangeTopicExchangeBindingParams.md), [`TOPIC`](../enumerations/EExchangeType.md#topic)>>

#### Returns

`void`

### getBindingParams()

> **getBindingParams**(): [`TExchangeTopicExchangeBindingParams`](../type-aliases/TExchangeTopicExchangeBindingParams.md)

#### Returns

[`TExchangeTopicExchangeBindingParams`](../type-aliases/TExchangeTopicExchangeBindingParams.md)

### getQueues()

> **getQueues**(`cb`): `void`

#### Parameters

▪ **cb**: `ICallback`<[`IQueueParams`](../interfaces/IQueueParams.md)[]>

#### Returns

`void`

#### Overrides

Exchange.getQueues

***

### toJSON()

> **toJSON**(): [`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)<[`TExchangeTopicExchangeBindingParams`](../type-aliases/TExchangeTopicExchangeBindingParams.md), [`TOPIC`](../enumerations/EExchangeType.md#topic)>

#### Returns

[`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)<[`TExchangeTopicExchangeBindingParams`](../type-aliases/TExchangeTopicExchangeBindingParams.md), [`TOPIC`](../enumerations/EExchangeType.md#topic)>

