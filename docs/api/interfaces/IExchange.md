[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IExchange

# Interface: IExchange\<BindingParams, ExchangeType\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `BindingParams` | `BindingParams` |
| `ExchangeType` | extends [`EExchangeType`](../enums/EExchangeType.md) |

## Hierarchy

- [`IExchangeSerialized`](IExchangeSerialized.md)\<`BindingParams`, `ExchangeType`\>

  ↳ **`IExchange`**

## Table of contents

### Properties

- [bindingParams](IExchange.md#bindingparams)
- [exchangeTag](IExchange.md#exchangetag)
- [type](IExchange.md#type)

### Methods

- [getBindingParams](IExchange.md#getbindingparams)
- [getQueues](IExchange.md#getqueues)
- [toJSON](IExchange.md#tojson)

## Properties

### bindingParams

• `Readonly` **bindingParams**: `BindingParams`

#### Inherited from

[IExchangeSerialized](IExchangeSerialized.md).[bindingParams](IExchangeSerialized.md#bindingparams)

___

### exchangeTag

• `Readonly` **exchangeTag**: `string`

#### Inherited from

[IExchangeSerialized](IExchangeSerialized.md).[exchangeTag](IExchangeSerialized.md#exchangetag)

___

### type

• `Readonly` **type**: `ExchangeType`

#### Inherited from

[IExchangeSerialized](IExchangeSerialized.md).[type](IExchangeSerialized.md#type)

## Methods

### getBindingParams

▸ **getBindingParams**(): `BindingParams`

#### Returns

`BindingParams`

___

### getQueues

▸ **getQueues**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<[`IQueueParams`](IQueueParams.md)[]\> |

#### Returns

`void`

___

### toJSON

▸ **toJSON**(): [`IExchangeSerialized`](IExchangeSerialized.md)\<`BindingParams`, `ExchangeType`\>

#### Returns

[`IExchangeSerialized`](IExchangeSerialized.md)\<`BindingParams`, `ExchangeType`\>
