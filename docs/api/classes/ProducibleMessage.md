[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ProducibleMessage

# Class: ProducibleMessage

The ProducibleMessage class is a core component of the Redis Simple Message Queue (RedisSMQ) library, designed to
encapsulate the properties and behaviors of a message that can be produced and consumed within the messaging system.
This class provides methods to set and retrieve various message attributes, such as TTL, retry policies, scheduling
options, and more.

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

Constructs a new instance of the ProducibleMessage class.

The constructor initializes the createdAt timestamp with the current time,
and sets default values for the consume timeout, retry delay, TTL, and retry threshold.
These default values are defined in the static property `defaultConsumeOptions`.

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

## Methods

### disablePriority

▸ **disablePriority**(): [`ProducibleMessage`](ProducibleMessage.md)

Disables the priority setting for the current message.

This method resets the priority level of the message to null, effectively disabling
the priority feature for this particular message. After calling this method, the message
will be processed based on its default settings, without considering its priority.

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

- The updated `ProducibleMessage` instance, allowing method chaining.

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setpriority

___

### getBody

▸ **getBody**(): `unknown`

Retrieves the payload of a message.

See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setbody

#### Returns

`unknown`

___

### getConsumeTimeout

▸ **getConsumeTimeout**(): `number`

Retrieves the consumption timeout value set for the message.

The consumption timeout specifies the maximum amount of time allowed for a consumer
to process the message before it is considered timed out.

#### Returns

`number`

The consumption timeout value in milliseconds.
                  A value of 0 indicates no timeout is set.

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setconsumetimeout

___

### getCreatedAt

▸ **getCreatedAt**(): `number`

Retrieves the timestamp when the message was created.

The createdAt timestamp is automatically set when a new message is created.

#### Returns

`number`

The createdAt timestamp as a Unix timestamp (milliseconds since epoch).
         This value can be used for tracking the age of the message or for
         other purposes related to message management.

___

### getExchange

▸ **getExchange**(): ``null`` \| [`TExchangeTransferable`](../README.md#texchangetransferable)

Retrieves the exchange (fan-out, topic, or queue name) associated with the current message.

This method returns the exchange that was set for the message using one of the
setQueue, setTopic, or setFanOut methods. The exchange determines how the message
will be routed within the messaging system.

#### Returns

``null`` \| [`TExchangeTransferable`](../README.md#texchangetransferable)

The exchange associated with the message.
         Returns null if no exchange has been set.
         The returned object contains information about the exchange type and its parameters.

**`See`**

 - https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setqueue
 - https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#settopic
 - https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setfanout

___

### getFanOut

▸ **getFanOut**(): ``null`` \| `string`

Retrieves the fan-out pattern associated with the current message.

This method returns the fan-out pattern that was set for the message using the
setFanOut method. The fan-out pattern determines how the message will be
distributed to multiple queues simultaneously.

#### Returns

``null`` \| `string`

The fan-out pattern name as a string if one has been set,
                         or null if no fan-out pattern has been defined for this message.

**`See`**

For more information on setting the fan-out pattern:
     https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setfanout

___

### getPriority

▸ **getPriority**(): ``null`` \| [`EMessagePriority`](../enums/EMessagePriority.md)

Retrieves the priority level set for the current message.

This method returns the priority level that was set for the message using the
setPriority method. The priority level determines the order in which messages
are processed when using a priority queue.

#### Returns

``null`` \| [`EMessagePriority`](../enums/EMessagePriority.md)

The priority level of the message as defined
         in the EMessagePriority enum, or null if no priority has been set.

**`See`**

For more information on setting the priority:
     https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setpriority

___

### getQueue

▸ **getQueue**(): ``null`` \| [`IQueueParams`](../interfaces/IQueueParams.md)

Retrieves the queue parameters associated with the current message.

This method returns the queue parameters that were set for the message using the
setQueue method. The queue parameters determine how the message will be routed within
the messaging system.

#### Returns

``null`` \| [`IQueueParams`](../interfaces/IQueueParams.md)

The queue parameters associated with the message.
         Returns null if no queue parameters have been set.

**`See`**

For more information on setting the queue parameters:
     https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setqueue

___

### getRetryDelay

▸ **getRetryDelay**(): `number`

Retrieves the retry delay set for the message.

The retry delay specifies the time interval to wait before attempting to reprocess
a failed message. This delay helps in managing system resources and allows for
temporary issues to be resolved before retrying.

#### Returns

`number`

The retry delay value in milliseconds. A value of 0 indicates no delay
         between retry attempts.

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setretrydelay

___

### getRetryThreshold

▸ **getRetryThreshold**(): `number`

Retrieves the retry threshold of a message.

The retry threshold specifies the maximum number of times a failed message
will be retried before it is considered permanently failed and potentially
moved to a dead-letter queue.

#### Returns

`number`

The retry threshold value. A positive integer representing the
         maximum number of retry attempts for the message.

**`See`**

For more information on setting the retry threshold:
     https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setretrythreshold

___

### getScheduledCRON

▸ **getScheduledCRON**(): ``null`` \| `string`

Retrieves the CRON expression associated with a scheduled message.

This method returns the CRON expression that was set for the message using
the setScheduledCRON method. The CRON expression defines the schedule
for recurring message deliveries.

#### Returns

``null`` \| `string`

The CRON expression as a string if one has been set,
                         or null if no CRON schedule has been defined for this message.

**`See`**

For more information on setting the CRON schedule:
     https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledcron

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

Retrieves the number of times a message is scheduled to repeat.

This method returns the value set by the setScheduledRepeat method, which determines
how many times a message should be redelivered after its initial delivery.

#### Returns

`number`

The number of times the message is scheduled to repeat.
                  A value of 0 indicates the message is not scheduled for repetition.

**`See`**

For more information on setting the scheduled repeat:
     https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledrepeat

___

### getScheduledRepeatPeriod

▸ **getScheduledRepeatPeriod**(): ``null`` \| `number`

Retrieves the scheduled repeat period of a message.

The repeat period is used in conjunction with the scheduled repeat count
to determine how often and how many times a message should be redelivered.

#### Returns

``null`` \| `number`

The scheduled repeat period in milliseconds if set,
                         or null if no repeat period has been defined for this message.

**`See`**

For more information on setting the scheduled repeat period:
     https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledrepeatperiod

___

### getTTL

▸ **getTTL**(): `number`

Retrieves the Time-To-Live (TTL) value set for the message.

The TTL determines how long the message should remain in the queue before
it expires. This is useful for managing message lifetimes and preventing
the processing of outdated messages.

#### Returns

`number`

The TTL value in milliseconds. A value of 0 indicates that the
         message does not expire.

**`See`**

For more information on setting the TTL:
     https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setttl

___

### getTopic

▸ **getTopic**(): ``null`` \| [`ITopicParams`](../interfaces/ITopicParams.md)

Retrieves the topic parameters associated with the current message.

This method returns the topic parameters that were set for the message using the
setTopic method. The topic parameters determine how the message will be routed within
the messaging system.

#### Returns

``null`` \| [`ITopicParams`](../interfaces/ITopicParams.md)

The topic parameters associated with the message.
         Returns null if no topic parameters have been set.

**`See`**

For more information on setting the topic parameters:
     https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#settopic

___

### hasPriority

▸ **hasPriority**(): `boolean`

Checks if a priority level has been set for the current message.

This method returns a boolean value indicating whether a priority level has been
specified for the message. If the priority level is not null, it means a priority
level has been set, and the method returns true. Otherwise, it returns false.

#### Returns

`boolean`

- Returns true if a priority level has been set for the message,
                     false otherwise.

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setpriority

___

### resetScheduledParams

▸ **resetScheduledParams**(): [`ProducibleMessage`](ProducibleMessage.md)

Resets the scheduled parameters of the message.

This function clears any previously set scheduled parameters for the message,
such as the CRON expression, delay, repeat period, and repeat count.
After calling this method, the message will no longer be scheduled for recurring deliveries.

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

The updated `ProducibleMessage` instance with the reset scheduled parameters.

**`See`**

 - https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledcron
 - https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduleddelay
 - https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledrepeatperiod
 - https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledrepeat

___

### setBody

▸ **setBody**(`body`): [`ProducibleMessage`](ProducibleMessage.md)

Sets the payload of the message to be sent.

The payload contains the actual data that the consumer will process.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `body` | `unknown` | The payload to be sent with the message. This can be of any type, but it will be converted to a string before being sent. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

- The updated `ProducibleMessage` instance, allowing method chaining.

**`See`**

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify

___

### setConsumeTimeout

▸ **setConsumeTimeout**(`timeout`): [`ProducibleMessage`](ProducibleMessage.md)

Sets the consumption timeout for the current message.

The consumption timeout specifies the maximum amount of time allowed for a consumer
to process the message before it is considered timed out. This feature is useful in
managing system resources and preventing messages from being stuck indefinitely.

The default consumption timeout is 0, which means there is no timeout set.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `timeout` | `number` | The consumption timeout value in milliseconds. A value of 0 indicates no timeout is set. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

- The updated `ProducibleMessage` instance, allowing method chaining.

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setconsumetimeout

___

### setFanOut

▸ **setFanOut**(`fanOutName`): [`ProducibleMessage`](ProducibleMessage.md)

Sets a fan-out pattern for message publication, enabling a publish-subscribe model
where messages can be sent to multiple queues simultaneously.

The fan-out pattern allows messages to be sent to multiple queues
simultaneously, enabling effective distribution of messages to various
subscribers.

This feature is particularly useful in scenarios where you
want multiple services to react to the same event or message without
needing to duplicate the message for each queue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fanOutName` | `string` | The name of the fan-out pattern. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

- The updated `ProducibleMessage` instance, allowing method chaining.

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/exchanges-and-delivery-models.md

___

### setPriority

▸ **setPriority**(`priority`): [`ProducibleMessage`](ProducibleMessage.md)

Sets the priority level of a message for processing.

This feature allows developers to manage the order in which messages are
processed based on their priority, enabling more important tasks to be handled before others.

Message priority should be set only when producing a message to a priority queue.
Otherwise, message priority does not take effect.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `priority` | [`EMessagePriority`](../enums/EMessagePriority.md) | The priority level for the message. The available priority levels are defined in the EMessagePriority enum. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

- The updated `ProducibleMessage` instance, allowing method chaining.

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/queues.md

___

### setQueue

▸ **setQueue**(`queueParams`): [`ProducibleMessage`](ProducibleMessage.md)

Sets the queue parameters for the message, enabling a direct message publication model
where messages can be sent to a specific queue and consumed
by consumers interested in those messages.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queueParams` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | The queue parameters can be provided as a string (queue name) or as an object (queue parameters). If a string is provided, it should be the name of the queue. If an object is provided, it should contain the queue parameters as defined in the RedisSMQ documentation. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

- The updated `ProducibleMessage` instance, allowing method chaining.

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/exchanges-and-delivery-models.md

___

### setRetryDelay

▸ **setRetryDelay**(`delay`): [`ProducibleMessage`](ProducibleMessage.md)

Sets the retry delay for failed messages.

This function allows you to specify how long the system should wait before attempting to retry the
processing of a failed message.

This feature is crucial in ensuring that message processing is robust,
especially in scenarios where temporary failures might occur, such as
database unavailability or network issues.

By utilizing a retry delay, you can reduce the risk of overwhelming your
system with retries for messages that are likely to fail again immediately,
thereby enhancing the reliability of your message processing.

This method should be used in conjunction with setRetryThreshold().

The default retry delay is 60000 milliseconds (1 minute).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `delay` | `number` | The retry delay value in milliseconds. A value of 0 indicates no delay between retry attempts. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

- The updated `ProducibleMessage` instance, allowing method chaining.

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setretrydelay

___

### setRetryThreshold

▸ **setRetryThreshold**(`threshold`): [`ProducibleMessage`](ProducibleMessage.md)

Sets the retry threshold for the current message.

Set the number of times a failed message can be retried before it is
considered permanently failed and moved to a dead-letter queue (DLQ) or discarded
according to the message queue configuration.

The default retry threshold is 3.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `threshold` | `number` | The retry threshold value. A positive integer representing the maximum number of retry attempts for the message. A value of 0 indicates no retry attempts. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

- The updated `ProducibleMessage` instance, allowing method chaining.

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setretrythreshold

___

### setScheduledCRON

▸ **setScheduledCRON**(`cron`): [`ProducibleMessage`](ProducibleMessage.md)

Sets a CRON expression for scheduling the message's delivery.

This function allows you to specify a CRON expression to define the schedule for
when the message should be delivered. The CRON expression is a string that follows
a specific format, which defines the frequency and timing of the delivery.

This function may be used in conjunction with setScheduledRepeat() and setScheduledRepeatPeriod(). For example,
to publish a message every day at 10AM and from then publish the message with a delay of 10 minutes for 3 times:

```typescript
const producibleMessage = new ProducibleMessage();
producibleMessage.setScheduledCRON('0 0 10 * * *').setScheduledRepeat(3).setScheduledRepeatPeriod(36000);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cron` | `string` | The CRON expression to define the schedule for the message's delivery. The expression should follow the CRON format standards. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

- Returns the instance of the ProducibleMessage class, allowing method chaining.

**`Throws`**

- Throws an error if the provided CRON expression is invalid.

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledcron

___

### setScheduledDelay

▸ **setScheduledDelay**(`delay`): [`ProducibleMessage`](ProducibleMessage.md)

Sets a delay for scheduling the current message's delivery.

This function allows you to specify a delay in milliseconds before the message is
actually sent to the queue. The delay ensures that the message is not delivered
immediately, allowing for the system to perform any necessary operations or checks.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `delay` | `number` | The delay value in milliseconds. A positive integer representing the time to wait before sending the message. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

- The updated `ProducibleMessage` instance, allowing method chaining.

**`Throws`**

- If the provided delay value is not a positive integer,
                                     this error is thrown.

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledelay

___

### setScheduledRepeat

▸ **setScheduledRepeat**(`repeat`): [`ProducibleMessage`](ProducibleMessage.md)

Sets the number of times a message is scheduled to repeat after its initial delivery.

This function is used to define how many times a message should be redelivered after its initial processing.
The repeat count is used in conjunction with the scheduled repeat period to determine the total number of times
the message will be delivered.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `repeat` | `number` | The number of times the message is scheduled to repeat. Must be a non-negative integer. If the provided value is not a number or is negative, a `MessageMessagePropertyError` is thrown. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

- The updated `ProducibleMessage` instance, allowing method chaining.

**`Throws`**

- If the provided repeat value is not a non-negative integer.

___

### setScheduledRepeatPeriod

▸ **setScheduledRepeatPeriod**(`period`): [`ProducibleMessage`](ProducibleMessage.md)

Sets the repeat period for a scheduled message.

This method allows you to specify a delay to wait for between each message delivery, enabling the
creation of recurring jobs without the need for complex CRON expressions.

The method should be used in conjunction with setScheduledRepeat() to determine
how many times a message should be redelivered.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `period` | `number` | The repeat period value in milliseconds. A positive integer representing the time interval between redeliveries. If the provided value is not a positive integer, a MessageMessagePropertyError is thrown. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

- The updated `ProducibleMessage` instance, allowing method chaining.

**`Throws`**

- If the provided period value is not a positive integer.

___

### setTTL

▸ **setTTL**(`ttl`): [`ProducibleMessage`](ProducibleMessage.md)

Sets the Time-To-Live (TTL) value for the current message.

The TTL determines how long the message should remain in the queue before
it expires. This is useful for managing message lifetimes and preventing
the processing of outdated messages.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ttl` | `number` | The TTL value in milliseconds. A value of 0 indicates that the message does not expire. |

#### Returns

[`ProducibleMessage`](ProducibleMessage.md)

- The updated `ProducibleMessage` instance, allowing method chaining.

**`See`**

https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setttl

___

### setTopic

▸ **setTopic**(`topicParams`): [`ProducibleMessage`](ProducibleMessage.md)

Sets a topic for message publication, enabling a publish-subscribe model
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

Sets default consume options for all messages.

This function allows developers to set default values for various consume options,
such as Time-To-Live (TTL), retry threshold, retry delay, and consumption timeout.
These default values can be overridden when producing a message.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `consumeOptions` | `Partial`\<[`TMessageConsumeOptions`](../README.md#tmessageconsumeoptions)\> | An object containing the consume options to be set as defaults. The object can include the following properties: - ttl: The default TTL value in milliseconds. - retryThreshold: The default retry threshold value. - retryDelay: The default retry delay value in milliseconds. - consumeTimeout: The default consumption timeout value in milliseconds. |

#### Returns

`void`

This function does not return any value.

**`Example`**

```typescript
// default consume options
const producibleMessage = new ProducibleMessage();
producibleMessage.getTTL(); // 0
producibleMessage.getRetryThreshold(); // 3
producibleMessage.getRetryDelay(); // 60000
producibleMessage.getConsumeTimeout(); // 0

// overriding default consume options for all messages
ProducibleMessage.setDefaultConsumeOptions({
  ttl: 60000,
  retryThreshold: 3,
  retryDelay: 60000,
  consumeTimeout: 120000
})

// checking updated default consume options
const msg = new ProducibleMessage();
msg.getTTL(); // 60000
msg.getRetryThreshold(); // 3
msg.getRetryDelay(); // 60000
msg.getConsumeTimeout(); // 120000

// overriding retry threshold for the current message
msg.setRetryThreshold(5);
msg.getRetryThreshold(); // 5
```
