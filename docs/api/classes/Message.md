[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Message

# Class: Message

## Table of contents

### Constructors

- [constructor](Message.md#constructor)

### Properties

- [MessagePriority](Message.md#messagepriority)

### Methods

- [disablePriority](Message.md#disablepriority)
- [getBody](Message.md#getbody)
- [getConsumeTimeout](Message.md#getconsumetimeout)
- [getCreatedAt](Message.md#getcreatedat)
- [getDestinationQueue](Message.md#getdestinationqueue)
- [getExchange](Message.md#getexchange)
- [getId](Message.md#getid)
- [getMessageScheduledDelay](Message.md#getmessagescheduleddelay)
- [getMessageState](Message.md#getmessagestate)
- [getNextScheduledTimestamp](Message.md#getnextscheduledtimestamp)
- [getPriority](Message.md#getpriority)
- [getPublishedAt](Message.md#getpublishedat)
- [getQueue](Message.md#getqueue)
- [getRequiredExchange](Message.md#getrequiredexchange)
- [getRequiredId](Message.md#getrequiredid)
- [getRequiredMessageState](Message.md#getrequiredmessagestate)
- [getRetryDelay](Message.md#getretrydelay)
- [getRetryThreshold](Message.md#getretrythreshold)
- [getScheduledAt](Message.md#getscheduledat)
- [getScheduledCRON](Message.md#getscheduledcron)
- [getScheduledMessageId](Message.md#getscheduledmessageid)
- [getScheduledRepeat](Message.md#getscheduledrepeat)
- [getScheduledRepeatPeriod](Message.md#getscheduledrepeatperiod)
- [getSetExpired](Message.md#getsetexpired)
- [getSetMessageState](Message.md#getsetmessagestate)
- [getStatus](Message.md#getstatus)
- [getTTL](Message.md#getttl)
- [hasNextDelay](Message.md#hasnextdelay)
- [hasPriority](Message.md#haspriority)
- [hasRetryThresholdExceeded](Message.md#hasretrythresholdexceeded)
- [isPeriodic](Message.md#isperiodic)
- [isSchedulable](Message.md#isschedulable)
- [resetScheduledParams](Message.md#resetscheduledparams)
- [setBody](Message.md#setbody)
- [setConsumeTimeout](Message.md#setconsumetimeout)
- [setDestinationQueue](Message.md#setdestinationqueue)
- [setExchange](Message.md#setexchange)
- [setFanOut](Message.md#setfanout)
- [setMessageState](Message.md#setmessagestate)
- [setPriority](Message.md#setpriority)
- [setQueue](Message.md#setqueue)
- [setRetryDelay](Message.md#setretrydelay)
- [setRetryThreshold](Message.md#setretrythreshold)
- [setScheduledCRON](Message.md#setscheduledcron)
- [setScheduledDelay](Message.md#setscheduleddelay)
- [setScheduledRepeat](Message.md#setscheduledrepeat)
- [setScheduledRepeatPeriod](Message.md#setscheduledrepeatperiod)
- [setStatus](Message.md#setstatus)
- [setTTL](Message.md#setttl)
- [setTopic](Message.md#settopic)
- [toJSON](Message.md#tojson)
- [toString](Message.md#tostring)
- [setDefaultConsumeOptions](Message.md#setdefaultconsumeoptions)

## Constructors

### constructor

• **new Message**(): [`Message`](Message.md)

#### Returns

[`Message`](Message.md)

## Properties

### MessagePriority

▪ `Static` `Readonly` **MessagePriority**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `ABOVE_NORMAL` | `number` |
| `HIGH` | `number` |
| `HIGHEST` | `number` |
| `LOW` | `number` |
| `LOWEST` | `number` |
| `NORMAL` | `number` |
| `VERY_HIGH` | `number` |
| `VERY_LOW` | `number` |

## Methods

### disablePriority

▸ **disablePriority**(): [`Message`](Message.md)

#### Returns

[`Message`](Message.md)

___

### getBody

▸ **getBody**(): `unknown`

#### Returns

`unknown`

___

### getConsumeTimeout

▸ **getConsumeTimeout**(): `number`

#### Returns

`number`

___

### getCreatedAt

▸ **getCreatedAt**(): `number`

#### Returns

`number`

___

### getDestinationQueue

▸ **getDestinationQueue**(): [`IQueueParams`](../interfaces/IQueueParams.md)

#### Returns

[`IQueueParams`](../interfaces/IQueueParams.md)

___

### getExchange

▸ **getExchange**(): ``null`` \| [`TExchange`](../README.md#texchange)

#### Returns

``null`` \| [`TExchange`](../README.md#texchange)

___

### getId

▸ **getId**(): ``null`` \| `string`

#### Returns

``null`` \| `string`

___

### getMessageScheduledDelay

▸ **getMessageScheduledDelay**(): ``null`` \| `number`

#### Returns

``null`` \| `number`

___

### getMessageState

▸ **getMessageState**(): ``null`` \| `MessageState`

#### Returns

``null`` \| `MessageState`

___

### getNextScheduledTimestamp

▸ **getNextScheduledTimestamp**(): `number`

#### Returns

`number`

___

### getPriority

▸ **getPriority**(): ``null`` \| `number`

#### Returns

``null`` \| `number`

___

### getPublishedAt

▸ **getPublishedAt**(): ``null`` \| `number`

#### Returns

``null`` \| `number`

___

### getQueue

▸ **getQueue**(): ``null`` \| `string` \| [`IQueueParams`](../interfaces/IQueueParams.md)

#### Returns

``null`` \| `string` \| [`IQueueParams`](../interfaces/IQueueParams.md)

___

### getRequiredExchange

▸ **getRequiredExchange**(): [`TExchange`](../README.md#texchange)

#### Returns

[`TExchange`](../README.md#texchange)

___

### getRequiredId

▸ **getRequiredId**(): `string`

#### Returns

`string`

___

### getRequiredMessageState

▸ **getRequiredMessageState**(): `MessageState`

#### Returns

`MessageState`

___

### getRetryDelay

▸ **getRetryDelay**(): `number`

#### Returns

`number`

___

### getRetryThreshold

▸ **getRetryThreshold**(): `number`

#### Returns

`number`

___

### getScheduledAt

▸ **getScheduledAt**(): ``null`` \| `number`

#### Returns

``null`` \| `number`

___

### getScheduledCRON

▸ **getScheduledCRON**(): ``null`` \| `string`

#### Returns

``null`` \| `string`

___

### getScheduledMessageId

▸ **getScheduledMessageId**(): ``null`` \| `string`

#### Returns

``null`` \| `string`

___

### getScheduledRepeat

▸ **getScheduledRepeat**(): `number`

#### Returns

`number`

___

### getScheduledRepeatPeriod

▸ **getScheduledRepeatPeriod**(): ``null`` \| `number`

#### Returns

``null`` \| `number`

___

### getSetExpired

▸ **getSetExpired**(): `boolean`

#### Returns

`boolean`

___

### getSetMessageState

▸ **getSetMessageState**(): `MessageState`

#### Returns

`MessageState`

___

### getStatus

▸ **getStatus**(): [`EMessagePropertyStatus`](../enums/EMessagePropertyStatus.md)

#### Returns

[`EMessagePropertyStatus`](../enums/EMessagePropertyStatus.md)

___

### getTTL

▸ **getTTL**(): `number`

#### Returns

`number`

___

### hasNextDelay

▸ **hasNextDelay**(): `boolean`

#### Returns

`boolean`

___

### hasPriority

▸ **hasPriority**(): `boolean`

#### Returns

`boolean`

___

### hasRetryThresholdExceeded

▸ **hasRetryThresholdExceeded**(): `boolean`

#### Returns

`boolean`

___

### isPeriodic

▸ **isPeriodic**(): `boolean`

#### Returns

`boolean`

___

### isSchedulable

▸ **isSchedulable**(): `boolean`

#### Returns

`boolean`

___

### resetScheduledParams

▸ **resetScheduledParams**(): [`Message`](Message.md)

#### Returns

[`Message`](Message.md)

___

### setBody

▸ **setBody**(`body`): [`Message`](Message.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | `unknown` |

#### Returns

[`Message`](Message.md)

___

### setConsumeTimeout

▸ **setConsumeTimeout**(`timeout`): [`Message`](Message.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `timeout` | `number` | In milliseconds |

#### Returns

[`Message`](Message.md)

___

### setDestinationQueue

▸ **setDestinationQueue**(`queue`): [`Message`](Message.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | [`IQueueParams`](../interfaces/IQueueParams.md) |

#### Returns

[`Message`](Message.md)

___

### setExchange

▸ **setExchange**(`exchange`): [`Message`](Message.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `exchange` | [`TExchange`](../README.md#texchange) |

#### Returns

[`Message`](Message.md)

___

### setFanOut

▸ **setFanOut**(`bindingKey`): [`Message`](Message.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `bindingKey` | `string` |

#### Returns

[`Message`](Message.md)

___

### setMessageState

▸ **setMessageState**(`m`): [`Message`](Message.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `m` | `MessageState` |

#### Returns

[`Message`](Message.md)

___

### setPriority

▸ **setPriority**(`priority`): [`Message`](Message.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `priority` | `number` |

#### Returns

[`Message`](Message.md)

___

### setQueue

▸ **setQueue**(`queueParams`): [`Message`](Message.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `queueParams` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |

#### Returns

[`Message`](Message.md)

___

### setRetryDelay

▸ **setRetryDelay**(`delay`): [`Message`](Message.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `delay` | `number` | In millis |

#### Returns

[`Message`](Message.md)

___

### setRetryThreshold

▸ **setRetryThreshold**(`threshold`): [`Message`](Message.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `threshold` | `number` |

#### Returns

[`Message`](Message.md)

___

### setScheduledCRON

▸ **setScheduledCRON**(`cron`): [`Message`](Message.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `cron` | `string` |

#### Returns

[`Message`](Message.md)

___

### setScheduledDelay

▸ **setScheduledDelay**(`delay`): [`Message`](Message.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `delay` | `number` | In millis |

#### Returns

[`Message`](Message.md)

___

### setScheduledRepeat

▸ **setScheduledRepeat**(`repeat`): [`Message`](Message.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `repeat` | `number` |

#### Returns

[`Message`](Message.md)

___

### setScheduledRepeatPeriod

▸ **setScheduledRepeatPeriod**(`period`): [`Message`](Message.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `period` | `number` | In millis |

#### Returns

[`Message`](Message.md)

___

### setStatus

▸ **setStatus**(`s`): [`Message`](Message.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `s` | [`EMessagePropertyStatus`](../enums/EMessagePropertyStatus.md) |

#### Returns

[`Message`](Message.md)

___

### setTTL

▸ **setTTL**(`ttl`): [`Message`](Message.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ttl` | `number` | In milliseconds |

#### Returns

[`Message`](Message.md)

___

### setTopic

▸ **setTopic**(`topicParams`): [`Message`](Message.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `topicParams` | `string` \| [`TTopicParams`](../modules.md#ttopicparams) |

#### Returns

[`Message`](Message.md)

___

### toJSON

▸ **toJSON**(): [`IMessageSerialized`](../interfaces/IMessageSerialized.md)

#### Returns

[`IMessageSerialized`](../interfaces/IMessageSerialized.md)

___

### toString

▸ **toString**(): `string`

#### Returns

`string`

___

### setDefaultConsumeOptions

▸ **setDefaultConsumeOptions**(`consumeOptions`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `consumeOptions` | `Partial`\<[`TMessageConsumeOptions`](../README.md#tmessageconsumeoptions)\> |

#### Returns

`void`
