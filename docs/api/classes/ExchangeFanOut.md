[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeFanOut

# Class: ExchangeFanOut

## Hierarchy

- `Exchange`\<[`TExchangeFanOutBindingParams`](../README.md#texchangefanoutbindingparams), [`FANOUT`](../enums/EExchangeType.md#fanout)\>

  ↳ **`ExchangeFanOut`**

## Table of contents

### Constructors

- [constructor](ExchangeFanOut.md#constructor)

### Properties

- [bindingParams](ExchangeFanOut.md#bindingparams)
- [exchangeTag](ExchangeFanOut.md#exchangetag)
- [type](ExchangeFanOut.md#type)

### Methods

- [bindQueue](ExchangeFanOut.md#bindqueue)
- [deleteExchange](ExchangeFanOut.md#deleteexchange)
- [fromJSON](ExchangeFanOut.md#fromjson)
- [getBindingParams](ExchangeFanOut.md#getbindingparams)
- [getQueues](ExchangeFanOut.md#getqueues)
- [saveExchange](ExchangeFanOut.md#saveexchange)
- [toJSON](ExchangeFanOut.md#tojson)
- [unbindQueue](ExchangeFanOut.md#unbindqueue)
- [getAllExchanges](ExchangeFanOut.md#getallexchanges)
- [getQueueExchange](ExchangeFanOut.md#getqueueexchange)

## Constructors

### constructor

• **new ExchangeFanOut**(`fanOutName`): [`ExchangeFanOut`](ExchangeFanOut.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `fanOutName` | `string` |

#### Returns

[`ExchangeFanOut`](ExchangeFanOut.md)

#### Overrides

Exchange\&lt;
  TExchangeFanOutBindingParams,
  EExchangeType.FANOUT
\&gt;.constructor

## Properties

### bindingParams

• `Readonly` **bindingParams**: `string`

#### Inherited from

Exchange.bindingParams

___

### exchangeTag

• **exchangeTag**: `string`

#### Inherited from

Exchange.exchangeTag

___

### type

• `Readonly` **type**: [`FANOUT`](../enums/EExchangeType.md#fanout)

#### Inherited from

Exchange.type

## Methods

### bindQueue

▸ **bindQueue**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### deleteExchange

▸ **deleteExchange**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### fromJSON

▸ **fromJSON**(`JSON`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `JSON` | `Partial`\<[`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)\<`string`, [`FANOUT`](../enums/EExchangeType.md#fanout)\>\> |

#### Returns

`void`

#### Inherited from

Exchange.fromJSON

___

### getBindingParams

▸ **getBindingParams**(): `string`

#### Returns

`string`

#### Inherited from

Exchange.getBindingParams

___

### getQueues

▸ **getQueues**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\> |

#### Returns

`void`

#### Overrides

Exchange.getQueues

___

### saveExchange

▸ **saveExchange**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### toJSON

▸ **toJSON**(): [`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)\<`string`, [`FANOUT`](../enums/EExchangeType.md#fanout)\>

#### Returns

[`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)\<`string`, [`FANOUT`](../enums/EExchangeType.md#fanout)\>

#### Inherited from

Exchange.toJSON

___

### unbindQueue

▸ **unbindQueue**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### getAllExchanges

▸ **getAllExchanges**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`string`[]\> |

#### Returns

`void`

___

### getQueueExchange

▸ **getQueueExchange**(`queue`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `cb` | `ICallback`\<``null`` \| [`ExchangeFanOut`](ExchangeFanOut.md)\> |

#### Returns

`void`
