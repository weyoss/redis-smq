[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IMessageTransferable

# Interface: IMessageTransferable\<TBody\>

## Extends

- [`IMessageParams`](IMessageParams.md)\<`TBody`\>

## Type Parameters

### TBody

`TBody` = `unknown`

## Properties

### body

> **body**: `TBody`

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`body`](IMessageParams.md#body)

***

### consumerGroupId

> **consumerGroupId**: `null` \| `string`

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`consumerGroupId`](IMessageParams.md#consumergroupid)

***

### consumeTimeout

> **consumeTimeout**: `number`

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`consumeTimeout`](IMessageParams.md#consumetimeout)

***

### createdAt

> **createdAt**: `number`

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`createdAt`](IMessageParams.md#createdat)

***

### destinationQueue

> **destinationQueue**: [`IQueueParams`](IQueueParams.md)

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`destinationQueue`](IMessageParams.md#destinationqueue)

***

### exchange

> **exchange**: `null` \| [`IExchangeParsedParams`](IExchangeParsedParams.md)

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`exchange`](IMessageParams.md#exchange)

***

### id

> **id**: `string`

***

### messageState

> **messageState**: [`IMessageStateTransferable`](IMessageStateTransferable.md)

***

### priority

> **priority**: `null` \| `number`

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`priority`](IMessageParams.md#priority)

***

### queue

> **queue**: `null` \| [`IQueueParams`](IQueueParams.md)

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`queue`](IMessageParams.md#queue)

***

### retryDelay

> **retryDelay**: `number`

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`retryDelay`](IMessageParams.md#retrydelay)

***

### retryThreshold

> **retryThreshold**: `number`

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`retryThreshold`](IMessageParams.md#retrythreshold)

***

### scheduledCron

> **scheduledCron**: `null` \| `string`

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`scheduledCron`](IMessageParams.md#scheduledcron)

***

### scheduledDelay

> **scheduledDelay**: `null` \| `number`

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`scheduledDelay`](IMessageParams.md#scheduleddelay)

***

### scheduledRepeat

> **scheduledRepeat**: `number`

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`scheduledRepeat`](IMessageParams.md#scheduledrepeat)

***

### scheduledRepeatPeriod

> **scheduledRepeatPeriod**: `null` \| `number`

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`scheduledRepeatPeriod`](IMessageParams.md#scheduledrepeatperiod)

***

### status

> **status**: [`EMessagePropertyStatus`](../enumerations/EMessagePropertyStatus.md)

***

### ttl

> **ttl**: `number`

#### Inherited from

[`IMessageParams`](IMessageParams.md).[`ttl`](IMessageParams.md#ttl)
