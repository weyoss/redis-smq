>[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IExchange

# Interface: IExchange`<BindingParams, ExchangeType>`

## Contents

- [Type parameters](IExchange.md#type-parameters)
- [Properties](IExchange.md#properties)
  - [bindingParams](IExchange.md#bindingparams)
  - [exchangeTag](IExchange.md#exchangetag)
  - [type](IExchange.md#type)
- [Methods](IExchange.md#methods)
  - [getBindingParams()](IExchange.md#getbindingparams)
  - [getQueues()](IExchange.md#getqueues)
  - [toJSON()](IExchange.md#tojson)

## Type parameters

▪ **BindingParams**

▪ **ExchangeType** extends [`EExchangeType`](../enumerations/EExchangeType.md)

## Properties

### bindingParams

> **`readonly`** **bindingParams**: `BindingParams`

#### Inherited from

[`IExchangeSerialized`](IExchangeSerialized.md).[`bindingParams`](IExchangeSerialized.md#bindingparams)

***

### exchangeTag

> **`readonly`** **exchangeTag**: `string`

#### Inherited from

[`IExchangeSerialized`](IExchangeSerialized.md).[`exchangeTag`](IExchangeSerialized.md#exchangetag)

***

### type

> **`readonly`** **type**: `ExchangeType`

#### Inherited from

[`IExchangeSerialized`](IExchangeSerialized.md).[`type`](IExchangeSerialized.md#type)

## Methods

### getBindingParams()

> **getBindingParams**(): `BindingParams`

#### Returns

`BindingParams`

***

### getQueues()

> **getQueues**(`cb`): `void`

#### Parameters

▪ **cb**: `ICallback`<[`IQueueParams`](IQueueParams.md)[]>

#### Returns

`void`

***

### toJSON()

> **toJSON**(): [`IExchangeSerialized`](IExchangeSerialized.md)<`BindingParams`, `ExchangeType`>

#### Returns

[`IExchangeSerialized`](IExchangeSerialized.md)<`BindingParams`, `ExchangeType`>

