[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeTopic

# Class: ExchangeTopic

## Hierarchy

- `Exchange`\<[`TExchangeTopicBindingParams`](../README.md#texchangetopicbindingparams), [`TOPIC`](../enums/EExchangeType.md#topic)\>

  ↳ **`ExchangeTopic`**

## Table of contents

### Constructors

- [constructor](ExchangeTopic.md#constructor)

### Properties

- [bindingParams](ExchangeTopic.md#bindingparams)
- [exchangeTag](ExchangeTopic.md#exchangetag)
- [type](ExchangeTopic.md#type)

### Methods

- [fromJSON](ExchangeTopic.md#fromjson)
- [getBindingParams](ExchangeTopic.md#getbindingparams)
- [getQueues](ExchangeTopic.md#getqueues)
- [toJSON](ExchangeTopic.md#tojson)

## Constructors

### constructor

• **new ExchangeTopic**(`topic`): [`ExchangeTopic`](ExchangeTopic.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `topic` | [`TExchangeTopicBindingParams`](../README.md#texchangetopicbindingparams) |

#### Returns

[`ExchangeTopic`](ExchangeTopic.md)

#### Overrides

Exchange\&lt;
  TExchangeTopicBindingParams,
  EExchangeType.TOPIC
\&gt;.constructor

## Properties

### bindingParams

• `Readonly` **bindingParams**: [`TExchangeTopicBindingParams`](../README.md#texchangetopicbindingparams)

#### Inherited from

Exchange.bindingParams

___

### exchangeTag

• **exchangeTag**: `string`

#### Inherited from

Exchange.exchangeTag

___

### type

• `Readonly` **type**: [`TOPIC`](../enums/EExchangeType.md#topic)

#### Inherited from

Exchange.type

## Methods

### fromJSON

▸ **fromJSON**(`JSON`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `JSON` | `Partial`\<[`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)\<[`TExchangeTopicBindingParams`](../README.md#texchangetopicbindingparams), [`TOPIC`](../enums/EExchangeType.md#topic)\>\> |

#### Returns

`void`

#### Inherited from

Exchange.fromJSON

___

### getBindingParams

▸ **getBindingParams**(): [`TExchangeTopicBindingParams`](../README.md#texchangetopicbindingparams)

#### Returns

[`TExchangeTopicBindingParams`](../README.md#texchangetopicbindingparams)

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

▸ **toJSON**(): [`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)\<[`TExchangeTopicBindingParams`](../README.md#texchangetopicbindingparams), [`TOPIC`](../enums/EExchangeType.md#topic)\>

#### Returns

[`IExchangeSerialized`](../interfaces/IExchangeSerialized.md)\<[`TExchangeTopicBindingParams`](../README.md#texchangetopicbindingparams), [`TOPIC`](../enums/EExchangeType.md#topic)\>

#### Inherited from

Exchange.toJSON
