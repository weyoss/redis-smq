[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Message

# Class: Message

## Contents

- [Constructors](Message.md#constructors)
  - [new Message()](Message.md#new-message)
- [Properties](Message.md#properties)
  - [MessagePriority](Message.md#messagepriority)
- [Methods](Message.md#methods)
  - [disablePriority()](Message.md#disablepriority)
  - [getBody()](Message.md#getbody)
  - [getConsumeTimeout()](Message.md#getconsumetimeout)
  - [getCreatedAt()](Message.md#getcreatedat)
  - [getDestinationQueue()](Message.md#getdestinationqueue)
  - [getExchange()](Message.md#getexchange)
  - [getId()](Message.md#getid)
  - [getMessageScheduledDelay()](Message.md#getmessagescheduleddelay)
  - [getMessageState()](Message.md#getmessagestate)
  - [getNextScheduledTimestamp()](Message.md#getnextscheduledtimestamp)
  - [getPriority()](Message.md#getpriority)
  - [getPublishedAt()](Message.md#getpublishedat)
  - [getQueue()](Message.md#getqueue)
  - [getRequiredExchange()](Message.md#getrequiredexchange)
  - [getRequiredId()](Message.md#getrequiredid)
  - [getRequiredMessageState()](Message.md#getrequiredmessagestate)
  - [getRetryDelay()](Message.md#getretrydelay)
  - [getRetryThreshold()](Message.md#getretrythreshold)
  - [getScheduledAt()](Message.md#getscheduledat)
  - [getScheduledCRON()](Message.md#getscheduledcron)
  - [getScheduledMessageId()](Message.md#getscheduledmessageid)
  - [getScheduledRepeat()](Message.md#getscheduledrepeat)
  - [getScheduledRepeatPeriod()](Message.md#getscheduledrepeatperiod)
  - [getSetExpired()](Message.md#getsetexpired)
  - [getSetMessageState()](Message.md#getsetmessagestate)
  - [getTTL()](Message.md#getttl)
  - [hasNextDelay()](Message.md#hasnextdelay)
  - [hasPriority()](Message.md#haspriority)
  - [hasRetryThresholdExceeded()](Message.md#hasretrythresholdexceeded)
  - [isPeriodic()](Message.md#isperiodic)
  - [isSchedulable()](Message.md#isschedulable)
  - [resetScheduledParams()](Message.md#resetscheduledparams)
  - [setBody()](Message.md#setbody)
  - [setConsumeTimeout()](Message.md#setconsumetimeout)
  - [setDestinationQueue()](Message.md#setdestinationqueue)
  - [setExchange()](Message.md#setexchange)
  - [setFanOut()](Message.md#setfanout)
  - [setMessageState()](Message.md#setmessagestate)
  - [setPriority()](Message.md#setpriority)
  - [setQueue()](Message.md#setqueue)
  - [setRetryDelay()](Message.md#setretrydelay)
  - [setRetryThreshold()](Message.md#setretrythreshold)
  - [setScheduledCRON()](Message.md#setscheduledcron)
  - [setScheduledDelay()](Message.md#setscheduleddelay)
  - [setScheduledRepeat()](Message.md#setscheduledrepeat)
  - [setScheduledRepeatPeriod()](Message.md#setscheduledrepeatperiod)
  - [setTTL()](Message.md#setttl)
  - [setTopic()](Message.md#settopic)
  - [toJSON()](Message.md#tojson)
  - [toString()](Message.md#tostring)
  - [setDefaultConsumeOptions()](Message.md#setdefaultconsumeoptions)

## Constructors

### new Message()

> **new Message**(): [`Message`](Message.md)

#### Returns

[`Message`](Message.md)

## Properties

### MessagePriority

> **`static`** **`readonly`** **MessagePriority**: `object`

#### Type declaration

##### ABOVE_NORMAL

> **ABOVE_NORMAL**: `number` = `3`

##### HIGH

> **HIGH**: `number` = `2`

##### HIGHEST

> **HIGHEST**: `number` = `0`

##### LOW

> **LOW**: `number` = `5`

##### LOWEST

> **LOWEST**: `number` = `7`

##### NORMAL

> **NORMAL**: `number` = `4`

##### VERY_HIGH

> **VERY_HIGH**: `number` = `1`

##### VERY_LOW

> **VERY_LOW**: `number` = `6`

## Methods

### disablePriority()

> **disablePriority**(): [`Message`](Message.md)

#### Returns

[`Message`](Message.md)

***

### getBody()

> **getBody**(): `unknown`

#### Returns

`unknown`

***

### getConsumeTimeout()

> **getConsumeTimeout**(): `number`

#### Returns

`number`

***

### getCreatedAt()

> **getCreatedAt**(): `number`

#### Returns

`number`

***

### getDestinationQueue()

> **getDestinationQueue**(): [`IQueueParams`](../interfaces/IQueueParams.md)

#### Returns

[`IQueueParams`](../interfaces/IQueueParams.md)

***

### getExchange()

> **getExchange**(): `null` | [`TExchange`](../type-aliases/TExchange.md)

#### Returns

`null` | [`TExchange`](../type-aliases/TExchange.md)

***

### getId()

> **getId**(): `null` | `string`

#### Returns

`null` | `string`

***

### getMessageScheduledDelay()

> **getMessageScheduledDelay**(): `null` | `number`

#### Returns

`null` | `number`

***

### getMessageState()

> **getMessageState**(): `null` | `MessageState`

#### Returns

`null` | `MessageState`

***

### getNextScheduledTimestamp()

> **getNextScheduledTimestamp**(): `number`

#### Returns

`number`

***

### getPriority()

> **getPriority**(): `null` | `number`

#### Returns

`null` | `number`

***

### getPublishedAt()

> **getPublishedAt**(): `null` | `number`

#### Returns

`null` | `number`

***

### getQueue()

> **getQueue**(): `null` | `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

#### Returns

`null` | `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

***

### getRequiredExchange()

> **getRequiredExchange**(): [`TExchange`](../type-aliases/TExchange.md)

#### Returns

[`TExchange`](../type-aliases/TExchange.md)

***

### getRequiredId()

> **getRequiredId**(): `string`

#### Returns

`string`

***

### getRequiredMessageState()

> **getRequiredMessageState**(): `MessageState`

#### Returns

`MessageState`

***

### getRetryDelay()

> **getRetryDelay**(): `number`

#### Returns

`number`

***

### getRetryThreshold()

> **getRetryThreshold**(): `number`

#### Returns

`number`

***

### getScheduledAt()

> **getScheduledAt**(): `null` | `number`

#### Returns

`null` | `number`

***

### getScheduledCRON()

> **getScheduledCRON**(): `null` | `string`

#### Returns

`null` | `string`

***

### getScheduledMessageId()

> **getScheduledMessageId**(): `null` | `string`

#### Returns

`null` | `string`

***

### getScheduledRepeat()

> **getScheduledRepeat**(): `number`

#### Returns

`number`

***

### getScheduledRepeatPeriod()

> **getScheduledRepeatPeriod**(): `null` | `number`

#### Returns

`null` | `number`

***

### getSetExpired()

> **getSetExpired**(): `boolean`

#### Returns

`boolean`

***

### getSetMessageState()

> **getSetMessageState**(): `MessageState`

#### Returns

`MessageState`

***

### getTTL()

> **getTTL**(): `number`

#### Returns

`number`

***

### hasNextDelay()

> **hasNextDelay**(): `boolean`

#### Returns

`boolean`

***

### hasPriority()

> **hasPriority**(): `boolean`

#### Returns

`boolean`

***

### hasRetryThresholdExceeded()

> **hasRetryThresholdExceeded**(): `boolean`

#### Returns

`boolean`

***

### isPeriodic()

> **isPeriodic**(): `boolean`

#### Returns

`boolean`

***

### isSchedulable()

> **isSchedulable**(): `boolean`

#### Returns

`boolean`

***

### resetScheduledParams()

> **resetScheduledParams**(): [`Message`](Message.md)

#### Returns

[`Message`](Message.md)

***

### setBody()

> **setBody**(`body`): [`Message`](Message.md)

#### Parameters

▪ **body**: `unknown`

#### Returns

[`Message`](Message.md)

***

### setConsumeTimeout()

> **setConsumeTimeout**(`timeout`): [`Message`](Message.md)

#### Parameters

▪ **timeout**: `number`

In milliseconds

#### Returns

[`Message`](Message.md)

***

### setDestinationQueue()

> **setDestinationQueue**(`queue`): [`Message`](Message.md)

#### Parameters

▪ **queue**: [`IQueueParams`](../interfaces/IQueueParams.md)

#### Returns

[`Message`](Message.md)

***

### setExchange()

> **setExchange**(`exchange`): [`Message`](Message.md)

#### Parameters

▪ **exchange**: [`TExchange`](../type-aliases/TExchange.md)

#### Returns

[`Message`](Message.md)

***

### setFanOut()

> **setFanOut**(`bindingKey`): [`Message`](Message.md)

#### Parameters

▪ **bindingKey**: `string`

#### Returns

[`Message`](Message.md)

***

### setMessageState()

> **setMessageState**(`m`): [`Message`](Message.md)

#### Parameters

▪ **m**: `MessageState`

#### Returns

[`Message`](Message.md)

***

### setPriority()

> **setPriority**(`priority`): [`Message`](Message.md)

#### Parameters

▪ **priority**: `number`

#### Returns

[`Message`](Message.md)

***

### setQueue()

> **setQueue**(`queueParams`): [`Message`](Message.md)

#### Parameters

▪ **queueParams**: `string` | [`IQueueParams`](../interfaces/IQueueParams.md)

#### Returns

[`Message`](Message.md)

***

### setRetryDelay()

> **setRetryDelay**(`delay`): [`Message`](Message.md)

#### Parameters

▪ **delay**: `number`

In millis

#### Returns

[`Message`](Message.md)

***

### setRetryThreshold()

> **setRetryThreshold**(`threshold`): [`Message`](Message.md)

#### Parameters

▪ **threshold**: `number`

#### Returns

[`Message`](Message.md)

***

### setScheduledCRON()

> **setScheduledCRON**(`cron`): [`Message`](Message.md)

#### Parameters

▪ **cron**: `string`

#### Returns

[`Message`](Message.md)

***

### setScheduledDelay()

> **setScheduledDelay**(`delay`): [`Message`](Message.md)

#### Parameters

▪ **delay**: `number`

In millis

#### Returns

[`Message`](Message.md)

***

### setScheduledRepeat()

> **setScheduledRepeat**(`repeat`): [`Message`](Message.md)

#### Parameters

▪ **repeat**: `number`

#### Returns

[`Message`](Message.md)

***

### setScheduledRepeatPeriod()

> **setScheduledRepeatPeriod**(`period`): [`Message`](Message.md)

#### Parameters

▪ **period**: `number`

In millis

#### Returns

[`Message`](Message.md)

***

### setTTL()

> **setTTL**(`ttl`): [`Message`](Message.md)

#### Parameters

▪ **ttl**: `number`

In milliseconds

#### Returns

[`Message`](Message.md)

***

### setTopic()

> **setTopic**(`topicParams`): [`Message`](Message.md)

#### Parameters

▪ **topicParams**: `string` | [`TTopicParams`](../type-aliases/TTopicParams.md)

#### Returns

[`Message`](Message.md)

***

### toJSON()

> **toJSON**(): [`IMessageSerialized`](../interfaces/IMessageSerialized.md)

#### Returns

[`IMessageSerialized`](../interfaces/IMessageSerialized.md)

***

### toString()

> **toString**(): `string`

#### Returns

`string`

***

### setDefaultConsumeOptions()

> **`static`** **setDefaultConsumeOptions**(`consumeOptions`): `void`

#### Parameters

▪ **consumeOptions**: `Partial`<[`TMessageConsumeOptions`](../type-aliases/TMessageConsumeOptions.md)>

#### Returns

`void`

