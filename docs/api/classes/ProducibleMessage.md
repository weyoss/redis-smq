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

Turn off priority settings for a message.

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setpriority

___

### getBody

▸ **getBody**(): `unknown`

Retrieve the payload of a message.

See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setbody

#### Returns

`unknown`

___

### getConsumeTimeout

▸ **getConsumeTimeout**(): `number`

Retrieve consumption timeout of a message.

See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setconsumetimeout

#### Returns

`number`

___

### getCreatedAt

▸ **getCreatedAt**(): `number`

Retrieve the timestamp, in milliseconds, of when a message was created.

When a message is created RedisSMQ automatically assigns a timestamp to mark its creation time.

#### Returns

`number`

___

### getExchange

▸ **getExchange**(): ``null`` \| [`TExchangeTransferable`](../README.md#texchangetransferable)

Retrieve the exchange (fan-out, topic, or queue name) associated with a
specific message.

#### Returns

``null`` \| [`TExchangeTransferable`](../README.md#texchangetransferable)

**`See`**

 - https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setqueue
 - https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#settopic
 - https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setfanout

___

### getFanOut

▸ **getFanOut**(): ``null`` \| `string`

Retrieve the fan-out pattern associated with a specific message.

#### Returns

``null`` \| `string`

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setfanout

___

### getPriority

▸ **getPriority**(): ``null`` \| [`EMessagePriority`](../enums/EMessagePriority.md)

Retrieve the priority level of a message.

See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setpriority

#### Returns

``null`` \| [`EMessagePriority`](../enums/EMessagePriority.md)

___

### getQueue

▸ **getQueue**(): ``null`` \| [`IQueueParams`](../interfaces/IQueueParams.md)

Retrieve the specific queue associated with a message instance.

#### Returns

``null`` \| [`IQueueParams`](../interfaces/IQueueParams.md)

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setqueue

___

### getRetryDelay

▸ **getRetryDelay**(): `number`

Retrieve the retry delay of a message.

See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setretrydelay

#### Returns

`number`

___

### getRetryThreshold

▸ **getRetryThreshold**(): `number`

Retrieve the retry threshold of a message.

See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setretrythreshold

#### Returns

`number`

___

### getScheduledCRON

▸ **getScheduledCRON**(): ``null`` \| `string`

Retrieve the CRON expression associated with a scheduled message.

See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledcron

#### Returns

``null`` \| `string`

___

### getScheduledDelay

▸ **getScheduledDelay**(): ``null`` \| `number`

Retrieve the scheduled delay time for a message, which indicates how long
the message should be delayed before it is delivered to a queue.

#### Returns

``null`` \| `number`

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduleddelay

___

### getScheduledRepeat

▸ **getScheduledRepeat**(): `number`

Retrieve the scheduled repeat interval of a message that has been
previously scheduled for repeat processing.

See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledrepeat

#### Returns

`number`

___

### getScheduledRepeatPeriod

▸ **getScheduledRepeatPeriod**(): ``null`` \| `number`

Retrieve the scheduled repeat period of a message.

See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledrepeatperiod

#### Returns

``null`` \| `number`

___

### getTTL

▸ **getTTL**(): `number`

Retrieve the TTL of a message.

See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setttl

#### Returns

`number`

___

### getTopic

▸ **getTopic**(): ``null`` \| [`ITopicParams`](../interfaces/ITopicParams.md)

Retrieve the topic name of the message.

When a message is sent to a topic, it is delivered to all queues of that topic.

#### Returns

``null`` \| [`ITopicParams`](../interfaces/ITopicParams.md)

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#settopic

___

### hasPriority

▸ **hasPriority**(): `boolean`

Check whether a particular message has priority settings enabled.

#### Returns

`boolean`

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setpriority

___

### resetScheduledParams

▸ **resetScheduledParams**(): [`ProducibleMessage`](ProducibleMessage.md)

Reset any scheduling settings for a message.

 This can be useful in scenarios where you want to change or update the
 scheduling settings.

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setBody

▸ **setBody**(`body`): [`ProducibleMessage`](ProducibleMessage.md)

Set the payload of a message that will be sent through the message queue.

The "body" contains the actual data that the consumer will process, and
it can be any valid format, such as a JSON object or string, that
JSON.serialize() accepts.

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | `unknown` |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

**`See`**

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify

___

### setConsumeTimeout

▸ **setConsumeTimeout**(`timeout`): [`ProducibleMessage`](ProducibleMessage.md)

Set a timeout for message consumption.

This feature is important for ensuring that message processing does not
hang indefinitely and allows you to define how long a consumer can take to
process a message before it is considered timed out.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `timeout` | `number` | In milliseconds. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setFanOut

▸ **setFanOut**(`fanOutName`): [`ProducibleMessage`](ProducibleMessage.md)

Set a fan-out message pattern for message publication.

The fan-out pattern allows messages to be sent to multiple queues
simultaneously, enabling effective distribution of messages to various
subscribers.

This feature is particularly useful in scenarios where you
want multiple services to react to the same event or message without
needing to duplicate the message for each queue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fanOutName` | `string` | The fan-out pattern. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/exchanges-and-delivery-models.md

___

### setPriority

▸ **setPriority**(`priority`): [`ProducibleMessage`](ProducibleMessage.md)

Set the priority level of a message in a priority queue.
This feature allows developers to manage the order in which messages are
processed based on their priority, enabling more important tasks to be handled before others.

Message priority should be set only when producing a message to a priority queue.
Otherwise, message priority does not take effect.

#### Parameters

| Name | Type |
| :------ | :------ |
| `priority` | [`EMessagePriority`](../enums/EMessagePriority.md) |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/queues.md

___

### setQueue

▸ **setQueue**(`queueParams`): [`ProducibleMessage`](ProducibleMessage.md)

Specify to which queue the message should be sent when it is published.

This feature allows developers to manage different types of tasks or jobs
by routing them to designated queues, facilitating better organization
and scalability of message processing in applications.

#### Parameters

| Name | Type |
| :------ | :------ |
| `queueParams` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/exchanges-and-delivery-models.md

___

### setRetryDelay

▸ **setRetryDelay**(`delay`): [`ProducibleMessage`](ProducibleMessage.md)

Set how long the system should wait before attempting to retry the
processing of a failed message.

This feature is crucial in ensuring that message processing is robust,
especially in scenarios where temporary failures might occur, such as
database unavailability or network issues.

By utilizing a retry delay, you can reduce the risk of overwhelming your
system with retries for messages that are likely to fail again immediately,
thereby enhancing the reliability of your message processing.

Use this method together with setRetryThreshold().

Default is 60000 millis (1 minute).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `delay` | `number` | The delay before retrying the processing of a message that has previously failed. In millis. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setRetryThreshold

▸ **setRetryThreshold**(`threshold`): [`ProducibleMessage`](ProducibleMessage.md)

Set the number of times a failed message can be retried before it is
considered failed and moved to a dead letter queue (DLQ) or handled in
some other way according to the configuration.

When a message fails processing, RedisSMQ can automatically retry the
message. The setRetryThreshold function controls how many times this retry
mechanism is attempted.

If all retries fail, the message can be moved to a DLQ for further
analysis or manual intervention.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `threshold` | `number` | Retry threshold |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setScheduledCRON

▸ **setScheduledCRON**(`cron`): [`ProducibleMessage`](ProducibleMessage.md)

Schedule jobs to be executed at specific intervals using the CRON syntax.
This feature allows users to set up recurring jobs in a flexible manner
based on time-based schedules.

Please note that setScheduledCRON() may be used together with
setScheduledRepeat() and setScheduledRepeatPeriod().
When used together, the message will be published respecting the CRON
expression, and then it will be repeated N times.
For example, to publish a message every day at 10AM and from then publish
the message with a delay of 10 min for 3 times:
producibleMessage.setScheduledCRON('0 0 10 * * *').setScheduledRepeat(3).setScheduledRepeatPeriod(36000)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cron` | `string` | A valid CRON expression. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setScheduledDelay

▸ **setScheduledDelay**(`delay`): [`ProducibleMessage`](ProducibleMessage.md)

Schedule a message to be delivered after a specified delay,
rather than being processed immediately upon sending.

This feature is particularly useful for situations where you want to defer
the execution of a job or message until a certain amount of time has passed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `delay` | `number` | Delay duration. The delay is set in milliseconds. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setScheduledRepeat

▸ **setScheduledRepeat**(`repeat`): [`ProducibleMessage`](ProducibleMessage.md)

Schedule a message to be delivered repeatedly for a specified number of
times.

To set an interval between each delivery use setScheduledRepeatPeriod().

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `repeat` | `number` | The number of times the message should be delivered to a queue. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setScheduledRepeatPeriod

▸ **setScheduledRepeatPeriod**(`period`): [`ProducibleMessage`](ProducibleMessage.md)

Specify a delay to wait for between each message delivery, enabling the
creation of recurring jobs without the need for complex CRON expressions.

Use setScheduledRepeat() to set the number of times the message should be delivered.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `period` | `number` | The interval, in milliseconds, between message publications. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledrepeat

___

### setTTL

▸ **setTTL**(`ttl`): [`ProducibleMessage`](ProducibleMessage.md)

Set a time-to-live (TTL) for messages in the queue.

This means that you can define a specific duration after which a message
will expire and be removed from the queue if it has not been processed.
This feature is helpful for managing resource consumption, ensuring that
old or unprocessed messages do not linger indefinitely.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ttl` | `number` | Should be >=0. In milliseconds. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

___

### setTopic

▸ **setTopic**(`topicParams`): [`ProducibleMessage`](ProducibleMessage.md)

Set a topic for message publication, enabling a publish-subscribe model
where messages can be sent to specific channels (topics) and consumed
by subscribers interested in those topics.

A topic can be thought of as a categorization or a label that groups
related queues together.

This feature is useful for organizing and filtering messages based on
their content or purpose.

#### Parameters

| Name | Type |
| :------ | :------ |
| `topicParams` | `string` \| [`ITopicParams`](../interfaces/ITopicParams.md) |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/exchanges-and-delivery-models.md

___

### setDefaultConsumeOptions

▸ **setDefaultConsumeOptions**(`consumeOptions`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `consumeOptions` | `Partial`\<[`TMessageConsumeOptions`](../README.md#tmessageconsumeoptions)\> |

#### Returns

`void`
