>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeFanOut

# Class: ExchangeFanOut

## Contents

- [Constructors](ExchangeFanOut.md#constructors)
  - [new ExchangeFanOut(queue)](ExchangeFanOut.md#new-exchangefanoutqueue)
- [Properties](ExchangeFanOut.md#properties)
  - [bindingParams](ExchangeFanOut.md#bindingparams)
  - [exchangeTag](ExchangeFanOut.md#exchangetag)
  - [type](ExchangeFanOut.md#type)
- [Methods](ExchangeFanOut.md#methods)
  - [bindQueue()](ExchangeFanOut.md#bindqueue)
  - [deleteExchange()](ExchangeFanOut.md#deleteexchange)
  - [fromJSON()](ExchangeFanOut.md#fromjson)
  - [getBindingParams()](ExchangeFanOut.md#getbindingparams)
  - [getQueues()](ExchangeFanOut.md#getqueues)
  - [saveExchange()](ExchangeFanOut.md#saveexchange)
  - [toJSON()](ExchangeFanOut.md#tojson)
  - [unbindQueue()](ExchangeFanOut.md#unbindqueue)
  - [getAllExchanges()](ExchangeFanOut.md#getallexchanges)
  - [getQueueExchange()](ExchangeFanOut.md#getqueueexchange)

## Constructors

### new ExchangeFanOut(queue)

> **new ExchangeFanOut**(`queue`): [`ExchangeFanOut`](ExchangeFanOut.md)

#### Parameters

▪ **queue**: `string`

#### Returns

[`ExchangeFanOut`](ExchangeFanOut.md)

#### Overrides

Exchange<
  TExchangeFanOutExchangeBindingParams,
  EExchangeType.FANOUT
>.constructor

## Properties

### bindingParams

> **`readonly`** **bindingParams**: `string`

### exchangeTag

> **exchangeTag**: `string`

### type

> **`readonly`** **type**: [`FANOUT`](../enumerations/EExchangeType.md#fanout)

## Methods

### bindQueue()

> **bindQueue**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

***

### deleteExchange()

> **deleteExchange**(`cb`): `void`

#### Parameters

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

***

### fromJSON()

> **fromJSON**(`JSON`): `void`

#### Parameters

▪ **JSON**: `Partial`<[`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)<`string`, [`FANOUT`](../enumerations/EExchangeType.md#fanout)>>

#### Returns

`void`

### getBindingParams()

> **getBindingParams**(): `string`

#### Returns

`string`

### getQueues()

> **getQueues**(`cb`): `void`

#### Parameters

▪ **cb**: `ICallback`<[`IQueueParams`](../interfaces/IQueueParams.md)[]>

#### Returns

`void`

#### Overrides

Exchange.getQueues

***

### saveExchange()

> **saveExchange**(`cb`): `void`

#### Parameters

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

***

### toJSON()

> **toJSON**(): [`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)<`string`, [`FANOUT`](../enumerations/EExchangeType.md#fanout)>

#### Returns

[`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)<`string`, [`FANOUT`](../enumerations/EExchangeType.md#fanout)>

### unbindQueue()

> **unbindQueue**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<`void`>

#### Returns

`void`

***

### getAllExchanges()

> **`static`** **getAllExchanges**(`cb`): `void`

#### Parameters

▪ **cb**: `ICallback`<`string`[]>

#### Returns

`void`

***

### getQueueExchange()

> **`static`** **getQueueExchange**(`queue`, `cb`): `void`

#### Parameters

▪ **queue**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

▪ **cb**: `ICallback`<`null` | [`ExchangeFanOut`](ExchangeFanOut.md)>

#### Returns

`void`

