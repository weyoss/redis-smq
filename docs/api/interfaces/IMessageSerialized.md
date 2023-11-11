[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IMessageSerialized

# Interface: IMessageSerialized

## Contents

- [Properties](IMessageSerialized.md#properties)
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

> **body**: `unknown`

***

### consumeTimeout

> **consumeTimeout**: `number`

***

### createdAt

> **createdAt**: `number`

***

### destinationQueue

> **destinationQueue**: `null` | [`IQueueParams`](IQueueParams.md)

***

### exchange

> **exchange**: `null` | [`TExchangeSerialized`](../type-aliases/TExchangeSerialized.md)

***

### priority

> **priority**: `null` | `number`

***

### retryDelay

> **retryDelay**: `number`

***

### retryThreshold

> **retryThreshold**: `number`

***

### scheduledCron

> **scheduledCron**: `null` | `string`

***

### scheduledDelay

> **scheduledDelay**: `null` | `number`

***

### scheduledRepeat

> **scheduledRepeat**: `number`

***

### scheduledRepeatPeriod

> **scheduledRepeatPeriod**: `null` | `number`

***

### ttl

> **ttl**: `number`

