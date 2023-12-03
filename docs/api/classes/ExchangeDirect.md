[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeDirect

# Class: ExchangeDirect

## Hierarchy

- `Exchange`\<[`TExchangeDirectBindingParams`](../README.md#texchangedirectbindingparams), [`DIRECT`](../enums/EExchangeType.md#direct)\>

  ↳ **`ExchangeDirect`**

## Table of contents

### Constructors

- [constructor](ExchangeDirect.md#constructor)

### Properties

- [bindingParams](ExchangeDirect.md#bindingparams)
- [exchangeTag](ExchangeDirect.md#exchangetag)
- [type](ExchangeDirect.md#type)

### Methods

- [fromJSON](ExchangeDirect.md#fromjson)
- [getBindingParams](ExchangeDirect.md#getbindingparams)
- [getQueues](ExchangeDirect.md#getqueues)
- [toJSON](ExchangeDirect.md#tojson)

## Constructors

### constructor

• **new ExchangeDirect**(`queue`): [`ExchangeDirect`](ExchangeDirect.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | [`TExchangeDirectBindingParams`](../README.md#texchangedirectbindingparams) |

#### Returns

[`ExchangeDirect`](ExchangeDirect.md)

#### Overrides

Exchange\&lt;
  TExchangeDirectBindingParams,
  EExchangeType.DIRECT
\&gt;.constructor

## Properties

### bindingParams

• `Readonly` **bindingParams**: [`TExchangeDirectBindingParams`](../README.md#texchangedirectbindingparams)

#### Inherited from

Exchange.bindingParams

___

### exchangeTag

• **exchangeTag**: `string`

#### Inherited from

Exchange.exchangeTag

___

### type

• `Readonly` **type**: [`DIRECT`](../enums/EExchangeType.md#direct)

#### Inherited from

Exchange.type

## Methods

### fromJSON

▸ **fromJSON**(`JSON`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `JSON` | `Partial`\<[`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)\<[`TExchangeDirectBindingParams`](../README.md#texchangedirectbindingparams), [`DIRECT`](../enums/EExchangeType.md#direct)\>\> |

#### Returns

`void`

#### Inherited from

Exchange.fromJSON

___

### getBindingParams

▸ **getBindingParams**(): [`TExchangeDirectBindingParams`](../README.md#texchangedirectbindingparams)

#### Returns

[`TExchangeDirectBindingParams`](../README.md#texchangedirectbindingparams)

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

### toJSON

▸ **toJSON**(): [`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)\<[`TExchangeDirectBindingParams`](../README.md#texchangedirectbindingparams), [`DIRECT`](../enums/EExchangeType.md#direct)\>

#### Returns

[`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)\<[`TExchangeDirectBindingParams`](../README.md#texchangedirectbindingparams), [`DIRECT`](../enums/EExchangeType.md#direct)\>

#### Inherited from

Exchange.toJSON
