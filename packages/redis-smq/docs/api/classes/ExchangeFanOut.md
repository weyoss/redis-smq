[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ExchangeFanOut

# Class: ExchangeFanOut

ExchangeFanOut implements the fan-out exchange pattern where messages
published to the exchange are routed to all queues bound to it.

## Extends

- `ExchangeAbstract`\<`string`\>

## Constructors

### Constructor

> **new ExchangeFanOut**(): `ExchangeFanOut`

#### Returns

`ExchangeFanOut`

#### Overrides

`ExchangeAbstract<string>.constructor`

## Methods

### bindQueue()

> **bindQueue**(`queue`, `exchangeParams`, `cb`): `void`

Binds a queue to a fan-out exchange.

#### Parameters

##### queue

The queue to bind

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### exchangeParams

`string`

The name of the fan-out exchange

##### cb

`ICallback`\<`void`\>

Callback function called when the operation completes

#### Returns

`void`

***

### deleteExchange()

> **deleteExchange**(`exchangeParams`, `cb`): `void`

Deletes a fan-out exchange from Redis.

#### Parameters

##### exchangeParams

`string`

The name of the fan-out exchange

##### cb

`ICallback`\<`void`\>

Callback function called when the operation completes

#### Returns

`void`

***

### getAllExchanges()

> **getAllExchanges**(`cb`): `void`

Retrieves all fan-out exchanges.

#### Parameters

##### cb

`ICallback`\<`string`[]\>

Callback function that receives the list of exchanges

#### Returns

`void`

***

### getQueueExchange()

> **getQueueExchange**(`queue`, `cb`): `void`

Retrieves the fan-out exchange a queue is bound to.

#### Parameters

##### queue

The queue to check

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`null` \| `string`\>

Callback function that receives the exchange name or null

#### Returns

`void`

***

### getQueues()

> **getQueues**(`exchangeParams`, `cb`): `void`

Retrieves all queues bound to a fan-out exchange.

#### Parameters

##### exchangeParams

`string`

The name of the fan-out exchange

##### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Callback function that receives the list of bound queues

#### Returns

`void`

#### Overrides

`ExchangeAbstract.getQueues`

***

### saveExchange()

> **saveExchange**(`exchangeParams`, `cb`): `void`

Saves a fan-out exchange to Redis.

#### Parameters

##### exchangeParams

`string`

The name of the fan-out exchange

##### cb

`ICallback`\<`void`\>

Callback function called when the operation completes

#### Returns

`void`

***

### shutdown()

> **shutdown**(`cb`): `void`

#### Parameters

##### cb

`ICallback`\<`void`\>

#### Returns

`void`

#### Inherited from

`ExchangeAbstract.shutdown`

***

### unbindQueue()

> **unbindQueue**(`queue`, `exchangeParams`, `cb`): `void`

Unbinds a queue from a fan-out exchange.

#### Parameters

##### queue

The queue to unbind

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### exchangeParams

`string`

The name of the fan-out exchange

##### cb

`ICallback`\<`void`\>

Callback function called when the operation completes

#### Returns

`void`
