[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IMessageTransferable

# Interface: IMessageTransferable

## Hierarchy

- [`IMessageParams`](IMessageParams.md)

  ↳ **`IMessageTransferable`**

## Table of contents

### Properties

- [body](IMessageTransferable.md#body)
- [consumeTimeout](IMessageTransferable.md#consumetimeout)
- [consumerGroupId](IMessageTransferable.md#consumergroupid)
- [createdAt](IMessageTransferable.md#createdat)
- [destinationQueue](IMessageTransferable.md#destinationqueue)
- [exchange](IMessageTransferable.md#exchange)
- [id](IMessageTransferable.md#id)
- [messageState](IMessageTransferable.md#messagestate)
- [priority](IMessageTransferable.md#priority)
- [retryDelay](IMessageTransferable.md#retrydelay)
- [retryThreshold](IMessageTransferable.md#retrythreshold)
- [scheduledCron](IMessageTransferable.md#scheduledcron)
- [scheduledDelay](IMessageTransferable.md#scheduleddelay)
- [scheduledRepeat](IMessageTransferable.md#scheduledrepeat)
- [scheduledRepeatPeriod](IMessageTransferable.md#scheduledrepeatperiod)
- [status](IMessageTransferable.md#status)
- [ttl](IMessageTransferable.md#ttl)

## Properties

### body

• **body**: `unknown`

#### Inherited from

[IMessageParams](IMessageParams.md).[body](IMessageParams.md#body)

___

### consumeTimeout

• **consumeTimeout**: `number`

#### Inherited from

[IMessageParams](IMessageParams.md).[consumeTimeout](IMessageParams.md#consumetimeout)

___

### consumerGroupId

• **consumerGroupId**: ``null`` \| `string`

#### Inherited from

[IMessageParams](IMessageParams.md).[consumerGroupId](IMessageParams.md#consumergroupid)

___

### createdAt

• **createdAt**: `number`

#### Inherited from

[IMessageParams](IMessageParams.md).[createdAt](IMessageParams.md#createdat)

___

### destinationQueue

• **destinationQueue**: [`IQueueParams`](IQueueParams.md)

#### Inherited from

[IMessageParams](IMessageParams.md).[destinationQueue](IMessageParams.md#destinationqueue)

___

### exchange

• **exchange**: [`TExchangeTransferable`](../README.md#texchangetransferable)

#### Inherited from

[IMessageParams](IMessageParams.md).[exchange](IMessageParams.md#exchange)

___

### id

• **id**: `string`

___

### messageState

• **messageState**: [`IMessageStateTransferable`](IMessageStateTransferable.md)

___

### priority

• **priority**: ``null`` \| `number`

#### Inherited from

[IMessageParams](IMessageParams.md).[priority](IMessageParams.md#priority)

___

### retryDelay

• **retryDelay**: `number`

#### Inherited from

[IMessageParams](IMessageParams.md).[retryDelay](IMessageParams.md#retrydelay)

___

### retryThreshold

• **retryThreshold**: `number`

#### Inherited from

[IMessageParams](IMessageParams.md).[retryThreshold](IMessageParams.md#retrythreshold)

___

### scheduledCron

• **scheduledCron**: ``null`` \| `string`

#### Inherited from

[IMessageParams](IMessageParams.md).[scheduledCron](IMessageParams.md#scheduledcron)

___

### scheduledDelay

• **scheduledDelay**: ``null`` \| `number`

#### Inherited from

[IMessageParams](IMessageParams.md).[scheduledDelay](IMessageParams.md#scheduleddelay)

___

### scheduledRepeat

• **scheduledRepeat**: `number`

#### Inherited from

[IMessageParams](IMessageParams.md).[scheduledRepeat](IMessageParams.md#scheduledrepeat)

___

### scheduledRepeatPeriod

• **scheduledRepeatPeriod**: ``null`` \| `number`

#### Inherited from

[IMessageParams](IMessageParams.md).[scheduledRepeatPeriod](IMessageParams.md#scheduledrepeatperiod)

___

### status

• **status**: [`EMessagePropertyStatus`](../enums/EMessagePropertyStatus.md)

___

### ttl

• **ttl**: `number`

#### Inherited from

[IMessageParams](IMessageParams.md).[ttl](IMessageParams.md#ttl)
