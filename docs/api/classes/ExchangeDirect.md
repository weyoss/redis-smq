>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeDirect

# Class: ExchangeDirect

## Contents

- [Constructors](ExchangeDirect.md#constructors)
  - [new ExchangeDirect(queue)](ExchangeDirect.md#new-exchangedirectqueue)
- [Properties](ExchangeDirect.md#properties)
  - [bindingParams](ExchangeDirect.md#bindingparams)
  - [exchangeTag](ExchangeDirect.md#exchangetag)
  - [type](ExchangeDirect.md#type)
- [Methods](ExchangeDirect.md#methods)
  - [fromJSON()](ExchangeDirect.md#fromjson)
  - [getBindingParams()](ExchangeDirect.md#getbindingparams)
  - [getQueues()](ExchangeDirect.md#getqueues)
  - [toJSON()](ExchangeDirect.md#tojson)

## Constructors

### new ExchangeDirect(queue)

> **new ExchangeDirect**(`queue`): [`ExchangeDirect`](ExchangeDirect.md)

#### Parameters

▪ **queue**: [`TExchangeDirectExchangeBindingParams`](../type-aliases/TExchangeDirectExchangeBindingParams.md)

#### Returns

[`ExchangeDirect`](ExchangeDirect.md)

#### Overrides

Exchange<
  TExchangeDirectExchangeBindingParams,
  EExchangeType.DIRECT
>.constructor

## Properties

### bindingParams

> **`readonly`** **bindingParams**: [`TExchangeDirectExchangeBindingParams`](../type-aliases/TExchangeDirectExchangeBindingParams.md)

### exchangeTag

> **exchangeTag**: `string`

### type

> **`readonly`** **type**: [`DIRECT`](../enumerations/EExchangeType.md#direct)

## Methods

### fromJSON()

> **fromJSON**(`JSON`): `void`

#### Parameters

▪ **JSON**: `Partial`<[`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)<[`TExchangeDirectExchangeBindingParams`](../type-aliases/TExchangeDirectExchangeBindingParams.md), [`DIRECT`](../enumerations/EExchangeType.md#direct)>>

#### Returns

`void`

### getBindingParams()

> **getBindingParams**(): [`TExchangeDirectExchangeBindingParams`](../type-aliases/TExchangeDirectExchangeBindingParams.md)

#### Returns

[`TExchangeDirectExchangeBindingParams`](../type-aliases/TExchangeDirectExchangeBindingParams.md)

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

> **toJSON**(): [`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)<[`TExchangeDirectExchangeBindingParams`](../type-aliases/TExchangeDirectExchangeBindingParams.md), [`DIRECT`](../enumerations/EExchangeType.md#direct)>

#### Returns

[`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)<[`TExchangeDirectExchangeBindingParams`](../type-aliases/TExchangeDirectExchangeBindingParams.md), [`DIRECT`](../enumerations/EExchangeType.md#direct)>

