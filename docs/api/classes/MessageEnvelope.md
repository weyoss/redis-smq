[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / MessageEnvelope

# Class: MessageEnvelope

## Table of contents

### Constructors

- [constructor](MessageEnvelope.md#constructor)

### Methods

- [disablePriority](MessageEnvelope.md#disablepriority)
- [getBody](MessageEnvelope.md#getbody)
- [getConsumeTimeout](MessageEnvelope.md#getconsumetimeout)
- [getCreatedAt](MessageEnvelope.md#getcreatedat)
- [getDestinationQueue](MessageEnvelope.md#getdestinationqueue)
- [getExchange](MessageEnvelope.md#getexchange)
- [getId](MessageEnvelope.md#getid)
- [getMessageScheduledDelay](MessageEnvelope.md#getmessagescheduleddelay)
- [getMessageState](MessageEnvelope.md#getmessagestate)
- [getNextScheduledTimestamp](MessageEnvelope.md#getnextscheduledtimestamp)
- [getPriority](MessageEnvelope.md#getpriority)
- [getPublishedAt](MessageEnvelope.md#getpublishedat)
- [getQueue](MessageEnvelope.md#getqueue)
- [getRequiredExchange](MessageEnvelope.md#getrequiredexchange)
- [getRequiredId](MessageEnvelope.md#getrequiredid)
- [getRequiredMessageState](MessageEnvelope.md#getrequiredmessagestate)
- [getRetryDelay](MessageEnvelope.md#getretrydelay)
- [getRetryThreshold](MessageEnvelope.md#getretrythreshold)
- [getScheduledAt](MessageEnvelope.md#getscheduledat)
- [getScheduledCRON](MessageEnvelope.md#getscheduledcron)
- [getScheduledMessageId](MessageEnvelope.md#getscheduledmessageid)
- [getScheduledRepeat](MessageEnvelope.md#getscheduledrepeat)
- [getScheduledRepeatPeriod](MessageEnvelope.md#getscheduledrepeatperiod)
- [getSetExpired](MessageEnvelope.md#getsetexpired)
- [getSetMessageState](MessageEnvelope.md#getsetmessagestate)
- [getStatus](MessageEnvelope.md#getstatus)
- [getTTL](MessageEnvelope.md#getttl)
- [hasNextDelay](MessageEnvelope.md#hasnextdelay)
- [hasPriority](MessageEnvelope.md#haspriority)
- [hasRetryThresholdExceeded](MessageEnvelope.md#hasretrythresholdexceeded)
- [isPeriodic](MessageEnvelope.md#isperiodic)
- [isSchedulable](MessageEnvelope.md#isschedulable)
- [resetScheduledParams](MessageEnvelope.md#resetscheduledparams)
- [setBody](MessageEnvelope.md#setbody)
- [setConsumeTimeout](MessageEnvelope.md#setconsumetimeout)
- [setDestinationQueue](MessageEnvelope.md#setdestinationqueue)
- [setExchange](MessageEnvelope.md#setexchange)
- [setFanOut](MessageEnvelope.md#setfanout)
- [setMessageState](MessageEnvelope.md#setmessagestate)
- [setPriority](MessageEnvelope.md#setpriority)
- [setQueue](MessageEnvelope.md#setqueue)
- [setRetryDelay](MessageEnvelope.md#setretrydelay)
- [setRetryThreshold](MessageEnvelope.md#setretrythreshold)
- [setScheduledCRON](MessageEnvelope.md#setscheduledcron)
- [setScheduledDelay](MessageEnvelope.md#setscheduleddelay)
- [setScheduledRepeat](MessageEnvelope.md#setscheduledrepeat)
- [setScheduledRepeatPeriod](MessageEnvelope.md#setscheduledrepeatperiod)
- [setStatus](MessageEnvelope.md#setstatus)
- [setTTL](MessageEnvelope.md#setttl)
- [setTopic](MessageEnvelope.md#settopic)
- [toJSON](MessageEnvelope.md#tojson)
- [toString](MessageEnvelope.md#tostring)
- [setDefaultConsumeOptions](MessageEnvelope.md#setdefaultconsumeoptions)

## Constructors

### constructor

• **new MessageEnvelope**(): [`MessageEnvelope`](MessageEnvelope.md)

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

## Methods

### disablePriority

▸ **disablePriority**(): [`MessageEnvelope`](MessageEnvelope.md)

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

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

▸ **resetScheduledParams**(): [`MessageEnvelope`](MessageEnvelope.md)

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setBody

▸ **setBody**(`body`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | `unknown` |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setConsumeTimeout

▸ **setConsumeTimeout**(`timeout`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `timeout` | `number` | In milliseconds |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setDestinationQueue

▸ **setDestinationQueue**(`queue`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `queue` | [`IQueueParams`](../interfaces/IQueueParams.md) |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setExchange

▸ **setExchange**(`exchange`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `exchange` | [`TExchange`](../README.md#texchange) |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setFanOut

▸ **setFanOut**(`bindingKey`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `bindingKey` | `string` |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setMessageState

▸ **setMessageState**(`m`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `m` | `MessageState` |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setPriority

▸ **setPriority**(`priority`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `priority` | `number` |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setQueue

▸ **setQueue**(`queueParams`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `queueParams` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setRetryDelay

▸ **setRetryDelay**(`delay`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `delay` | `number` | In millis |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setRetryThreshold

▸ **setRetryThreshold**(`threshold`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `threshold` | `number` |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setScheduledCRON

▸ **setScheduledCRON**(`cron`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `cron` | `string` |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setScheduledDelay

▸ **setScheduledDelay**(`delay`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `delay` | `number` | In millis |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setScheduledRepeat

▸ **setScheduledRepeat**(`repeat`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `repeat` | `number` |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setScheduledRepeatPeriod

▸ **setScheduledRepeatPeriod**(`period`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `period` | `number` | In millis |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setStatus

▸ **setStatus**(`s`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `s` | [`EMessagePropertyStatus`](../enums/EMessagePropertyStatus.md) |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setTTL

▸ **setTTL**(`ttl`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ttl` | `number` | In milliseconds |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

___

### setTopic

▸ **setTopic**(`topicParams`): [`MessageEnvelope`](MessageEnvelope.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `topicParams` | `string` \| [`TTopicParams`](../README.md#ttopicparams) |

#### Returns

[`MessageEnvelope`](MessageEnvelope.md)

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
