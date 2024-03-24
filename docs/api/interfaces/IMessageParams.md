[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IMessageParams

# Interface: IMessageParams

## Hierarchy

- **`IMessageParams`**

  ↳ [`IMessageTransferable`](IMessageTransferable.md)

## Table of contents

### Properties

- [body](IMessageParams.md#body)
- [consumeTimeout](IMessageParams.md#consumetimeout)
- [consumerGroupId](IMessageParams.md#consumergroupid)
- [createdAt](IMessageParams.md#createdat)
- [destinationQueue](IMessageParams.md#destinationqueue)
- [exchange](IMessageParams.md#exchange)
- [priority](IMessageParams.md#priority)
- [retryDelay](IMessageParams.md#retrydelay)
- [retryThreshold](IMessageParams.md#retrythreshold)
- [scheduledCron](IMessageParams.md#scheduledcron)
- [scheduledDelay](IMessageParams.md#scheduleddelay)
- [scheduledRepeat](IMessageParams.md#scheduledrepeat)
- [scheduledRepeatPeriod](IMessageParams.md#scheduledrepeatperiod)
- [ttl](IMessageParams.md#ttl)

## Properties

### body

• **body**: `unknown`

___

### consumeTimeout

• **consumeTimeout**: `number`

___

### consumerGroupId

• **consumerGroupId**: ``null`` \| `string`

___

### createdAt

• **createdAt**: `number`

___

### destinationQueue

• **destinationQueue**: [`IQueueParams`](IQueueParams.md)

___

### exchange

• **exchange**: [`TExchangeTransferable`](../README.md#texchangetransferable)

___

### priority

• **priority**: ``null`` \| `number`

___

### retryDelay

• **retryDelay**: `number`

___

### retryThreshold

• **retryThreshold**: `number`

___

### scheduledCron

• **scheduledCron**: ``null`` \| `string`

___

### scheduledDelay

• **scheduledDelay**: ``null`` \| `number`

___

### scheduledRepeat

• **scheduledRepeat**: `number`

___

### scheduledRepeatPeriod

• **scheduledRepeatPeriod**: ``null`` \| `number`

___

### ttl

• **ttl**: `number`
