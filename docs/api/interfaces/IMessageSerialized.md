[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IMessageSerialized

# Interface: IMessageSerialized

## Table of contents

### Properties

- [body](IMessageSerialized.md#body)
- [consumeTimeout](IMessageSerialized.md#consumetimeout)
- [createdAt](IMessageSerialized.md#createdat)
- [destinationQueue](IMessageSerialized.md#destinationqueue)
- [exchange](IMessageSerialized.md#exchange)
- [priority](IMessageSerialized.md#priority)
- [retryDelay](IMessageSerialized.md#retrydelay)
- [retryThreshold](IMessageSerialized.md#retrythreshold)
- [scheduledCron](IMessageSerialized.md#scheduledcron)
- [scheduledDelay](IMessageSerialized.md#scheduleddelay)
- [scheduledRepeat](IMessageSerialized.md#scheduledrepeat)
- [scheduledRepeatPeriod](IMessageSerialized.md#scheduledrepeatperiod)
- [ttl](IMessageSerialized.md#ttl)

## Properties

### body

• **body**: `unknown`

___

### consumeTimeout

• **consumeTimeout**: `number`

___

### createdAt

• **createdAt**: `number`

___

### destinationQueue

• **destinationQueue**: ``null`` \| [`IQueueParams`](IQueueParams.md)

___

### exchange

• **exchange**: ``null`` \| [`TExchangeSerialized`](../README.md#texchangeserialized)

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
