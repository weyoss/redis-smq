[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / IConsumableMessage

# Interface: IConsumableMessage

## Table of contents

### Methods

- [getBody](IConsumableMessage.md#getbody)
- [getConsumeTimeout](IConsumableMessage.md#getconsumetimeout)
- [getCreatedAt](IConsumableMessage.md#getcreatedat)
- [getDestinationQueue](IConsumableMessage.md#getdestinationqueue)
- [getExchange](IConsumableMessage.md#getexchange)
- [getFanOut](IConsumableMessage.md#getfanout)
- [getId](IConsumableMessage.md#getid)
- [getPriority](IConsumableMessage.md#getpriority)
- [getPublishedAt](IConsumableMessage.md#getpublishedat)
- [getQueue](IConsumableMessage.md#getqueue)
- [getRetryDelay](IConsumableMessage.md#getretrydelay)
- [getRetryThreshold](IConsumableMessage.md#getretrythreshold)
- [getScheduledAt](IConsumableMessage.md#getscheduledat)
- [getScheduledCRON](IConsumableMessage.md#getscheduledcron)
- [getScheduledDelay](IConsumableMessage.md#getscheduleddelay)
- [getScheduledMessageId](IConsumableMessage.md#getscheduledmessageid)
- [getScheduledRepeat](IConsumableMessage.md#getscheduledrepeat)
- [getScheduledRepeatPeriod](IConsumableMessage.md#getscheduledrepeatperiod)
- [getStatus](IConsumableMessage.md#getstatus)
- [getTTL](IConsumableMessage.md#getttl)
- [getTopic](IConsumableMessage.md#gettopic)
- [hasPriority](IConsumableMessage.md#haspriority)
- [toJSON](IConsumableMessage.md#tojson)

## Methods

### getBody

▸ **getBody**(): `unknown`

#### Returns

`unknown`

#### Inherited from

Omit.getBody

___

### getConsumeTimeout

▸ **getConsumeTimeout**(): `number`

#### Returns

`number`

#### Inherited from

Omit.getConsumeTimeout

___

### getCreatedAt

▸ **getCreatedAt**(): `number`

#### Returns

`number`

#### Inherited from

Omit.getCreatedAt

___

### getDestinationQueue

▸ **getDestinationQueue**(): [`IQueueParams`](IQueueParams.md)

#### Returns

[`IQueueParams`](IQueueParams.md)

#### Inherited from

Pick.getDestinationQueue

___

### getExchange

▸ **getExchange**(): [`TExchange`](../README.md#texchange)

#### Returns

[`TExchange`](../README.md#texchange)

#### Inherited from

Pick.getExchange

___

### getFanOut

▸ **getFanOut**(): ``null`` \| `string`

#### Returns

``null`` \| `string`

#### Inherited from

Omit.getFanOut

___

### getId

▸ **getId**(): `string`

#### Returns

`string`

#### Inherited from

Pick.getId

___

### getPriority

▸ **getPriority**(): ``null`` \| [`EMessagePriority`](../enums/EMessagePriority.md)

#### Returns

``null`` \| [`EMessagePriority`](../enums/EMessagePriority.md)

#### Inherited from

Omit.getPriority

___

### getPublishedAt

▸ **getPublishedAt**(): ``null`` \| `number`

#### Returns

``null`` \| `number`

#### Inherited from

Pick.getPublishedAt

___

### getQueue

▸ **getQueue**(): ``null`` \| `string` \| [`IQueueParams`](IQueueParams.md)

#### Returns

``null`` \| `string` \| [`IQueueParams`](IQueueParams.md)

#### Inherited from

Omit.getQueue

___

### getRetryDelay

▸ **getRetryDelay**(): `number`

#### Returns

`number`

#### Inherited from

Omit.getRetryDelay

___

### getRetryThreshold

▸ **getRetryThreshold**(): `number`

#### Returns

`number`

#### Inherited from

Omit.getRetryThreshold

___

### getScheduledAt

▸ **getScheduledAt**(): ``null`` \| `number`

#### Returns

``null`` \| `number`

#### Inherited from

Pick.getScheduledAt

___

### getScheduledCRON

▸ **getScheduledCRON**(): ``null`` \| `string`

#### Returns

``null`` \| `string`

#### Inherited from

Omit.getScheduledCRON

___

### getScheduledDelay

▸ **getScheduledDelay**(): ``null`` \| `number`

#### Returns

``null`` \| `number`

#### Inherited from

Omit.getScheduledDelay

___

### getScheduledMessageId

▸ **getScheduledMessageId**(): ``null`` \| `string`

#### Returns

``null`` \| `string`

#### Inherited from

Pick.getScheduledMessageId

___

### getScheduledRepeat

▸ **getScheduledRepeat**(): `number`

#### Returns

`number`

#### Inherited from

Omit.getScheduledRepeat

___

### getScheduledRepeatPeriod

▸ **getScheduledRepeatPeriod**(): ``null`` \| `number`

#### Returns

``null`` \| `number`

#### Inherited from

Omit.getScheduledRepeatPeriod

___

### getStatus

▸ **getStatus**(): [`EMessagePropertyStatus`](../enums/EMessagePropertyStatus.md)

#### Returns

[`EMessagePropertyStatus`](../enums/EMessagePropertyStatus.md)

#### Inherited from

Pick.getStatus

___

### getTTL

▸ **getTTL**(): `number`

#### Returns

`number`

#### Inherited from

Omit.getTTL

___

### getTopic

▸ **getTopic**(): ``null`` \| `string` \| [`TTopicParams`](../README.md#ttopicparams)

#### Returns

``null`` \| `string` \| [`TTopicParams`](../README.md#ttopicparams)

#### Inherited from

Omit.getTopic

___

### hasPriority

▸ **hasPriority**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Omit.hasPriority

___

### toJSON

▸ **toJSON**(): [`IMessageSerialized`](IMessageSerialized.md)

#### Returns

[`IMessageSerialized`](IMessageSerialized.md)

#### Inherited from

Pick.toJSON
