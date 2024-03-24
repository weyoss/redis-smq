[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducibleMessage

# Class: ProducibleMessage

## Table of contents

### Constructors

- [constructor](ProducibleMessage.md#constructor)

### Methods

- [disablePriority](ProducibleMessage.md#disablepriority)
- [getBody](ProducibleMessage.md#getbody)
- [getConsumeTimeout](ProducibleMessage.md#getconsumetimeout)
- [getCreatedAt](ProducibleMessage.md#getcreatedat)
- [getExchange](ProducibleMessage.md#getexchange)
- [getFanOut](ProducibleMessage.md#getfanout)
- [getPriority](ProducibleMessage.md#getpriority)
- [getQueue](ProducibleMessage.md#getqueue)
- [getRetryDelay](ProducibleMessage.md#getretrydelay)
- [getRetryThreshold](ProducibleMessage.md#getretrythreshold)
- [getScheduledCRON](ProducibleMessage.md#getscheduledcron)
- [getScheduledDelay](ProducibleMessage.md#getscheduleddelay)
- [getScheduledRepeat](ProducibleMessage.md#getscheduledrepeat)
- [getScheduledRepeatPeriod](ProducibleMessage.md#getscheduledrepeatperiod)
- [getTTL](ProducibleMessage.md#getttl)
- [getTopic](ProducibleMessage.md#gettopic)
- [hasPriority](ProducibleMessage.md#haspriority)
- [resetScheduledParams](ProducibleMessage.md#resetscheduledparams)
- [setBody](ProducibleMessage.md#setbody)
- [setConsumeTimeout](ProducibleMessage.md#setconsumetimeout)
- [setFanOut](ProducibleMessage.md#setfanout)
- [setPriority](ProducibleMessage.md#setpriority)
- [setQueue](ProducibleMessage.md#setqueue)
- [setRetryDelay](ProducibleMessage.md#setretrydelay)
- [setRetryThreshold](ProducibleMessage.md#setretrythreshold)
- [setScheduledCRON](ProducibleMessage.md#setscheduledcron)
- [setScheduledDelay](ProducibleMessage.md#setscheduleddelay)
- [setScheduledRepeat](ProducibleMessage.md#setscheduledrepeat)
- [setScheduledRepeatPeriod](ProducibleMessage.md#setscheduledrepeatperiod)
- [setTTL](ProducibleMessage.md#setttl)
- [setTopic](ProducibleMessage.md#settopic)
- [setDefaultConsumeOptions](ProducibleMessage.md#setdefaultconsumeoptions)

## Constructors

### constructor

• **new ProducibleMessage**(): [`ProducibleMessage`](ProducibleMessage.md)

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

## Methods

### disablePriority

▸ **disablePriority**(): [`ProducibleMessage`](ProducibleMessage.md)

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

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

### getExchange

▸ **getExchange**(): ``null`` \| [`TExchangeTransferable`](../README.md#texchangetransferable)

#### Returns

``null`` \| [`TExchangeTransferable`](../README.md#texchangetransferable)

___

### getFanOut

▸ **getFanOut**(): ``null`` \| `string`

#### Returns

``null`` \| `string`

___

### getPriority

▸ **getPriority**(): ``null`` \| [`EMessagePriority`](../enums/EMessagePriority.md)

#### Returns

``null`` \| [`EMessagePriority`](../enums/EMessagePriority.md)

___

### getQueue

▸ **getQueue**(): ``null`` \| [`IQueueParams`](../interfaces/IQueueParams.md)

#### Returns

``null`` \| [`IQueueParams`](../interfaces/IQueueParams.md)

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

### getScheduledCRON

▸ **getScheduledCRON**(): ``null`` \| `string`

#### Returns

``null`` \| `string`

___

### getScheduledDelay

▸ **getScheduledDelay**(): ``null`` \| `number`

#### Returns

``null`` \| `number`

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

### getTTL

▸ **getTTL**(): `number`

#### Returns

`number`

___

### getTopic

▸ **getTopic**(): ``null`` \| [`ITopicParams`](../interfaces/ITopicParams.md)

#### Returns

``null`` \| [`ITopicParams`](../interfaces/ITopicParams.md)

___

### hasPriority

▸ **hasPriority**(): `boolean`

#### Returns

`boolean`

___

### resetScheduledParams

▸ **resetScheduledParams**(): [`ProducibleMessage`](ProducibleMessage.md)

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setBody

▸ **setBody**(`body`): [`ProducibleMessage`](ProducibleMessage.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | `unknown` |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setConsumeTimeout

▸ **setConsumeTimeout**(`timeout`): [`ProducibleMessage`](ProducibleMessage.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `timeout` | `number` | In milliseconds |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setFanOut

▸ **setFanOut**(`fanOutName`): [`ProducibleMessage`](ProducibleMessage.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `fanOutName` | `string` |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setPriority

▸ **setPriority**(`priority`): [`ProducibleMessage`](ProducibleMessage.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `priority` | [`EMessagePriority`](../enums/EMessagePriority.md) |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setQueue

▸ **setQueue**(`queueParams`): [`ProducibleMessage`](ProducibleMessage.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `queueParams` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setRetryDelay

▸ **setRetryDelay**(`delay`): [`ProducibleMessage`](ProducibleMessage.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `delay` | `number` | In millis |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setRetryThreshold

▸ **setRetryThreshold**(`threshold`): [`ProducibleMessage`](ProducibleMessage.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `threshold` | `number` |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setScheduledCRON

▸ **setScheduledCRON**(`cron`): [`ProducibleMessage`](ProducibleMessage.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `cron` | `string` |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setScheduledDelay

▸ **setScheduledDelay**(`delay`): [`ProducibleMessage`](ProducibleMessage.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `delay` | `number` | In millis |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setScheduledRepeat

▸ **setScheduledRepeat**(`repeat`): [`ProducibleMessage`](ProducibleMessage.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `repeat` | `number` |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setScheduledRepeatPeriod

▸ **setScheduledRepeatPeriod**(`period`): [`ProducibleMessage`](ProducibleMessage.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `period` | `number` | In millis |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setTTL

▸ **setTTL**(`ttl`): [`ProducibleMessage`](ProducibleMessage.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ttl` | `number` | In milliseconds |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setTopic

▸ **setTopic**(`topicParams`): [`ProducibleMessage`](ProducibleMessage.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `topicParams` | `string` \| [`ITopicParams`](../interfaces/ITopicParams.md) |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setDefaultConsumeOptions

▸ **setDefaultConsumeOptions**(`consumeOptions`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `consumeOptions` | `Partial`\<[`TMessageConsumeOptions`](../README.md#tmessageconsumeoptions)\> |

#### Returns

`void`
