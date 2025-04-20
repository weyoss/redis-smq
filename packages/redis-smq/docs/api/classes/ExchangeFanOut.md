[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeFanOut

# Class: ExchangeFanOut

ExchangeFanOut implements the fan-out exchange pattern where messages
published to the exchange are routed to all queues bound to it.

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

#### Overrides

ExchangeAbstract\<string\>.constructor

## Methods

### bindQueue

▸ **bindQueue**(`queue`, `exchangeParams`, `cb`): `void`

Binds a queue to a fan-out exchange.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | The queue to bind |
| `exchangeParams` | `string` | The name of the fan-out exchange |
| `cb` | `ICallback`\<`void`\> | Callback function called when the operation completes |

#### Returns

`void`

___

### deleteExchange

▸ **deleteExchange**(`exchangeParams`, `cb`): `void`

Deletes a fan-out exchange from Redis.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `exchangeParams` | `string` | The name of the fan-out exchange |
| `cb` | `ICallback`\<`void`\> | Callback function called when the operation completes |

#### Returns

`void`

___

### getAllExchanges

▸ **getAllExchanges**(`cb`): `void`

Retrieves all fan-out exchanges.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | `ICallback`\<`string`[]\> | Callback function that receives the list of exchanges |

#### Returns

`void`

___

### getQueueExchange

▸ **getQueueExchange**(`queue`, `cb`): `void`

Retrieves the fan-out exchange a queue is bound to.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | The queue to check |
| `cb` | `ICallback`\<``null`` \| `string`\> | Callback function that receives the exchange name or null |

#### Returns

`void`

___

### getQueues

▸ **getQueues**(`exchangeParams`, `cb`): `void`

Retrieves all queues bound to a fan-out exchange.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `exchangeParams` | `string` | The name of the fan-out exchange |
| `cb` | `ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\> | Callback function that receives the list of bound queues |

#### Returns

`void`

#### Overrides

ExchangeAbstract.getQueues

___

### saveExchange

▸ **saveExchange**(`exchangeParams`, `cb`): `void`

Saves a fan-out exchange to Redis.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `exchangeParams` | `string` | The name of the fan-out exchange |
| `cb` | `ICallback`\<`void`\> | Callback function called when the operation completes |

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

Unbinds a queue from a fan-out exchange.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | The queue to unbind |
| `exchangeParams` | `string` | The name of the fan-out exchange |
| `cb` | `ICallback`\<`void`\> | Callback function called when the operation completes |

#### Returns

`void`
