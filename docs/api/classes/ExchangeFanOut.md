[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeFanOut

# Class: ExchangeFanOut

## Hierarchy

- `ExchangeAbstract`\<`string`\>

  ↳ **`ExchangeFanOut`**

## Table of contents

### Constructors

- [constructor](ExchangeFanOut.md#constructor)

### Methods

- [bindQueue](ExchangeFanOut.md#bindqueue)
- [deleteExchange](ExchangeFanOut.md#deleteexchange)
- [getAllExchanges](ExchangeFanOut.md#getallexchanges)
- [getQueueExchange](ExchangeFanOut.md#getqueueexchange)
- [getQueues](ExchangeFanOut.md#getqueues)
- [saveExchange](ExchangeFanOut.md#saveexchange)
- [shutdown](ExchangeFanOut.md#shutdown)
- [unbindQueue](ExchangeFanOut.md#unbindqueue)

## Constructors

### constructor

• **new ExchangeFanOut**(): [`ExchangeFanOut`](ExchangeFanOut.md)

#### Returns

[`ExchangeFanOut`](ExchangeFanOut.md)

#### Inherited from

ExchangeAbstract\<string\>.constructor

## Methods

### bindQueue

▸ **bindQueue**(`queue`, `exchangeParams`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `exchangeParams` | `string` |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

___

### deleteExchange

▸ **deleteExchange**(`exchangeParams`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `exchangeParams` | `string` |
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
| `cb` | `ICallback`\<``null`` \| `string`\> |

#### Returns

`void`

___

### getQueues

▸ **getQueues**(`exchangeParams`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `exchangeParams` | `string` |
| `cb` | `ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\> |

#### Returns

`void`

#### Overrides

ExchangeAbstract.getQueues

___

### saveExchange

▸ **saveExchange**(`exchangeParams`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `exchangeParams` | `string` |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`

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

___

### unbindQueue

▸ **unbindQueue**(`queue`, `exchangeParams`, `cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |
| `exchangeParams` | `string` |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`
