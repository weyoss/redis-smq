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

> **consumerGroupId**: `null` \| `string`

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

> **exchange**: [`TExchangeTransferable`](../type-aliases/TExchangeTransferable.md)

***

### priority

> **priority**: `null` \| `number`

***

### retryDelay

> **retryDelay**: `number`

***

### retryThreshold

> **retryThreshold**: `number`

***

### scheduledCron

> **scheduledCron**: `null` \| `string`

***

### scheduledDelay

> **scheduledDelay**: `null` \| `number`

***

### scheduledRepeat

> **scheduledRepeat**: `number`

***

### scheduledRepeatPeriod

> **scheduledRepeatPeriod**: `null` \| `number`

***

### ttl

> **ttl**: `number`
