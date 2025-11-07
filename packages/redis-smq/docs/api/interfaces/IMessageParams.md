[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IMessageParams

# Interface: IMessageParams\<TBody\>

## Extended by

- [`IMessageTransferable`](IMessageTransferable.md)

## Type Parameters

### TBody

`TBody` = `unknown`

## Properties

### body

> **body**: `TBody`

***

### consumerGroupId

> **consumerGroupId**: `string` \| `null`

***

### consumeTimeout

> **consumeTimeout**: `number`

***

### createdAt

> **createdAt**: `number`

***

### destinationQueue

> **destinationQueue**: [`IQueueParams`](IQueueParams.md)

***

### exchange

> **exchange**: [`IExchangeParsedParams`](IExchangeParsedParams.md) \| `null`

***

### priority

> **priority**: `number` \| `null`

***

### queue

> **queue**: [`IQueueParams`](IQueueParams.md) \| `null`

***

### retryDelay

> **retryDelay**: `number`

***

### retryThreshold

> **retryThreshold**: `number`

***

### scheduledCron

> **scheduledCron**: `string` \| `null`

***

### scheduledDelay

> **scheduledDelay**: `number` \| `null`

***

### scheduledRepeat

> **scheduledRepeat**: `number`

***

### scheduledRepeatPeriod

> **scheduledRepeatPeriod**: `number` \| `null`

***

### ttl

> **ttl**: `number`
