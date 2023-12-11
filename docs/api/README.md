[RedisSMQ](../../README.md) / [Docs](../README.md) / API Reference

# API Reference

## Table of contents

### Enumerations

- [EConsumeMessageDeadLetterCause](enums/EConsumeMessageDeadLetterCause.md)
- [EConsumeMessageUnacknowledgedCause](enums/EConsumeMessageUnacknowledgedCause.md)
- [EExchangeType](enums/EExchangeType.md)
- [EMessagePriority](enums/EMessagePriority.md)
- [EMessageProperty](enums/EMessageProperty.md)
- [EMessagePropertyStatus](enums/EMessagePropertyStatus.md)
- [EQueueProperty](enums/EQueueProperty.md)
- [EQueueType](enums/EQueueType.md)

### Classes

- [Configuration](classes/Configuration.md)
- [Consumer](classes/Consumer.md)
- [ExchangeDirect](classes/ExchangeDirect.md)
- [ExchangeFanOut](classes/ExchangeFanOut.md)
- [ExchangeTopic](classes/ExchangeTopic.md)
- [Message](classes/Message.md)
- [MessageEnvelope](classes/MessageEnvelope.md)
- [Namespace](classes/Namespace.md)
- [Producer](classes/Producer.md)
- [Queue](classes/Queue.md)
- [QueueAcknowledgedMessages](classes/QueueAcknowledgedMessages.md)
- [QueueDeadLetteredMessages](classes/QueueDeadLetteredMessages.md)
- [QueueMessages](classes/QueueMessages.md)
- [QueuePendingMessages](classes/QueuePendingMessages.md)
- [QueueRateLimit](classes/QueueRateLimit.md)
- [QueueScheduledMessages](classes/QueueScheduledMessages.md)

### Errors

- [ConsumerError](classes/ConsumerError.md)
- [ConsumerMessageHandlerAlreadyExistsError](classes/ConsumerMessageHandlerAlreadyExistsError.md)
- [ExchangeError](classes/ExchangeError.md)
- [ExchangeFanOutError](classes/ExchangeFanOutError.md)
- [ExchangeInvalidDataError](classes/ExchangeInvalidDataError.md)
- [MessageDeleteError](classes/MessageDeleteError.md)
- [MessageNotFoundError](classes/MessageNotFoundError.md)
- [MessageDestinationQueueAlreadySetError](classes/MessageDestinationQueueAlreadySetError.md)
- [MessageDestinationQueueRequiredError](classes/MessageDestinationQueueRequiredError.md)
- [MessageError](classes/MessageError.md)
- [MessageExchangeRequiredError](classes/MessageExchangeRequiredError.md)
- [ProducerError](classes/ProducerError.md)
- [ProducerInstanceNotRunningError](classes/ProducerInstanceNotRunningError.md)
- [ProducerMessageAlreadyPublishedError](classes/ProducerMessageAlreadyPublishedError.md)
- [ProducerMessageNotPublishedError](classes/ProducerMessageNotPublishedError.md)
- [ProducerMessageNotScheduledError](classes/ProducerMessageNotScheduledError.md)
- [QueueError](classes/QueueError.md)
- [QueueExistsError](classes/QueueExistsError.md)
- [QueueHasRunningConsumersError](classes/QueueHasRunningConsumersError.md)
- [QueueMessageRequeueError](classes/QueueMessageRequeueError.md)
- [QueueNamespaceNotFoundError](classes/QueueNamespaceNotFoundError.md)
- [QueueNotEmptyError](classes/QueueNotEmptyError.md)
- [QueueNotFoundError](classes/QueueNotFoundError.md)
- [QueueRateLimitError](classes/QueueRateLimitError.md)

### Interfaces

- [IConsumerHeartbeat](interfaces/IConsumerHeartbeat.md)
- [IConsumerHeartbeatPayload](interfaces/IConsumerHeartbeatPayload.md)
- [IConsumerMessageHandlerArgs](interfaces/IConsumerMessageHandlerArgs.md)
- [IEventListener](interfaces/IEventListener.md)
- [IEventListenersConfig](interfaces/IEventListenersConfig.md)
- [IExchange](interfaces/IExchange.md)
- [IExchangeSerialized](interfaces/IExchangeSerialized.md)
- [IMessageSerialized](interfaces/IMessageSerialized.md)
- [IMessageStateSerialized](interfaces/IMessageStateSerialized.md)
- [IMessagesConfig](interfaces/IMessagesConfig.md)
- [IMessagesConfigStorage](interfaces/IMessagesConfigStorage.md)
- [IMessagesConfigStorageOptions](interfaces/IMessagesConfigStorageOptions.md)
- [IMessagesConfigStorageOptionsRequired](interfaces/IMessagesConfigStorageOptionsRequired.md)
- [IMessagesConfigStorageRequired](interfaces/IMessagesConfigStorageRequired.md)
- [IQueueMessages](interfaces/IQueueMessages.md)
- [IQueueMessagesCount](interfaces/IQueueMessagesCount.md)
- [IQueueMessagesPage](interfaces/IQueueMessagesPage.md)
- [IQueueParams](interfaces/IQueueParams.md)
- [IQueueProperties](interfaces/IQueueProperties.md)
- [IQueueRateLimit](interfaces/IQueueRateLimit.md)
- [IRedisSMQConfig](interfaces/IRedisSMQConfig.md)
- [IRedisSMQConfigRequired](interfaces/IRedisSMQConfigRequired.md)

### Type Aliases

- [IEventListenersConfigRequired](README.md#ieventlistenersconfigrequired)
- [IQueueMessagesPageParams](README.md#iqueuemessagespageparams)
- [TConsumerMessageHandler](README.md#tconsumermessagehandler)
- [TConsumerRedisKeys](README.md#tconsumerrediskeys)
- [TEventListenerInitArgs](README.md#teventlistenerinitargs)
- [TExchange](README.md#texchange)
- [TExchangeDirect](README.md#texchangedirect)
- [TExchangeDirectBindingParams](README.md#texchangedirectbindingparams)
- [TExchangeDirectSerialized](README.md#texchangedirectserialized)
- [TExchangeFanOut](README.md#texchangefanout)
- [TExchangeFanOutBindingParams](README.md#texchangefanoutbindingparams)
- [TExchangeFanOutSerialized](README.md#texchangefanoutserialized)
- [TExchangeSerialized](README.md#texchangeserialized)
- [TExchangeTopic](README.md#texchangetopic)
- [TExchangeTopicBindingParams](README.md#texchangetopicbindingparams)
- [TExchangeTopicSerialized](README.md#texchangetopicserialized)
- [TMessageConsumeOptions](README.md#tmessageconsumeoptions)
- [TQueueConsumer](README.md#tqueueconsumer)
- [TRedisSMQEvent](README.md#tredissmqevent)
- [TTopicParams](README.md#ttopicparams)

### Functions

- [disconnect](README.md#disconnect)

## Type Aliases

### IEventListenersConfigRequired

Ƭ **IEventListenersConfigRequired**: `Required`\<[`IEventListenersConfig`](interfaces/IEventListenersConfig.md)\>

---

### IQueueMessagesPageParams

Ƭ **IQueueMessagesPageParams**: `Object`

#### Type declaration


| Name          | Type     |
| :-------------- | :--------- |
| `currentPage` | `number` |
| `offsetEnd`   | `number` |
| `offsetStart` | `number` |
| `totalPages`  | `number` |

---

### TConsumerMessageHandler

Ƭ **TConsumerMessageHandler**: (`msg`: [`MessageEnvelope`](classes/Message.md), `cb`: `ICallback`\<`void`\>) => `void`

#### Type declaration

▸ (`msg`, `cb`): `void`

##### Parameters


| Name  | Type                            |
| :------ | :-------------------------------- |
| `msg` | [`MessageEnvelope`](classes/Message.md) |
| `cb`  | `ICallback`\<`void`\>           |

##### Returns

`void`

---

### TConsumerRedisKeys

Ƭ **TConsumerRedisKeys**: `ReturnType`\<typeof `redisKeys`[``"getConsumerKeys"``]\>

---

### TEventListenerInitArgs

Ƭ **TEventListenerInitArgs**: `Object`

#### Type declaration


| Name            | Type                                                           |
| :---------------- | :--------------------------------------------------------------- |
| `eventProvider` | `EventEmitter`\<[`TRedisSMQEvent`](README.md#tredissmqevent)\> |
| `instanceId`    | `string`                                                       |

---

### TExchange

Ƭ **TExchange**: [`TExchangeDirect`](README.md#texchangedirect) \| [`TExchangeTopic`](README.md#texchangetopic) \| [`TExchangeFanOut`](README.md#texchangefanout)

---

### TExchangeDirect

Ƭ **TExchangeDirect**: [`IExchange`](interfaces/IExchange.md)\<[`TExchangeDirectBindingParams`](README.md#texchangedirectbindingparams), [`DIRECT`](enums/EExchangeType.md#direct)\>

---

### TExchangeDirectBindingParams

Ƭ **TExchangeDirectBindingParams**: [`IQueueParams`](interfaces/IQueueParams.md) \| `string`

---

### TExchangeDirectSerialized

Ƭ **TExchangeDirectSerialized**: [`IExchangeSerialized`](interfaces/IExchangeSerialized.md)\<[`TExchangeDirectBindingParams`](README.md#texchangedirectbindingparams), [`DIRECT`](enums/EExchangeType.md#direct)\>

---

### TExchangeFanOut

Ƭ **TExchangeFanOut**: [`IExchange`](interfaces/IExchange.md)\<[`TExchangeFanOutBindingParams`](README.md#texchangefanoutbindingparams), [`FANOUT`](enums/EExchangeType.md#fanout)\>

---

### TExchangeFanOutBindingParams

Ƭ **TExchangeFanOutBindingParams**: `string`

---

### TExchangeFanOutSerialized

Ƭ **TExchangeFanOutSerialized**: [`IExchangeSerialized`](interfaces/IExchangeSerialized.md)\<[`TExchangeFanOutBindingParams`](README.md#texchangefanoutbindingparams), [`FANOUT`](enums/EExchangeType.md#fanout)\>

---

### TExchangeSerialized

Ƭ **TExchangeSerialized**: [`TExchangeDirectSerialized`](README.md#texchangedirectserialized) \| [`TExchangeTopicSerialized`](README.md#texchangetopicserialized) \| [`TExchangeFanOutSerialized`](README.md#texchangefanoutserialized)

---

### TExchangeTopic

Ƭ **TExchangeTopic**: [`IExchange`](interfaces/IExchange.md)\<[`TExchangeTopicBindingParams`](README.md#texchangetopicbindingparams), [`TOPIC`](enums/EExchangeType.md#topic)\>

---

### TExchangeTopicBindingParams

Ƭ **TExchangeTopicBindingParams**: [`TTopicParams`](README.md#ttopicparams) \| `string`

---

### TExchangeTopicSerialized

Ƭ **TExchangeTopicSerialized**: [`IExchangeSerialized`](interfaces/IExchangeSerialized.md)\<[`TExchangeTopicBindingParams`](README.md#texchangetopicbindingparams), [`TOPIC`](enums/EExchangeType.md#topic)\>

---

### TMessageConsumeOptions

Ƭ **TMessageConsumeOptions**: `Object`

#### Type declaration


| Name             | Type     |
| :----------------- | :--------- |
| `consumeTimeout` | `number` |
| `retryDelay`     | `number` |
| `retryThreshold` | `number` |
| `ttl`            | `number` |

---

### TQueueConsumer

Ƭ **TQueueConsumer**: `Object`

#### Type declaration


| Name        | Type       |
| :------------ | :----------- |
| `createdAt` | `number`   |
| `hostname`  | `string`   |
| `ipAddress` | `string`[] |
| `pid`       | `number`   |

---

### TRedisSMQEvent

- [`TEvent`](https://github.com/weyoss/redis-smq-common/blob/master/docs/api/README.md#tevent)

  ↳ `TRedisSMQEvent`.

Ƭ **TRedisSMQEvent**


| Event Name              | Arguments                                                                                                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `heartbeatTick`         | (`timestamp`: `number`, `consumerId`: `string`, `heartbeatPayload`: [`IConsumerHeartbeat`](interfaces/IConsumerHeartbeat.md)) => `void` ;                                                                                                      |
| `messageAcknowledged`   | (`messageId`: `string`, `queue`: [`IQueueParams`](interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` ;                                                                                               |
| `messageDeadLettered`   | (`cause`: [`EConsumeMessageDeadLetterCause`](enums/EConsumeMessageDeadLetterCause.md), `messageId`: `string`, `queue`: [`IQueueParams`](interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` ;         |
| `messageDelayed`        | (`messageId`: `string`, `queue`: [`IQueueParams`](interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` ;                                                                                               |
| `messagePublished`      | (`messageId`: `string`, `queue`: [`IQueueParams`](interfaces/IQueueParams.md)) => `void` ;                                                                                                                                                     |
| `messageReceived`       | (`messageId`: `string`, `queue`: [`IQueueParams`](interfaces/IQueueParams.md), `consumerId`: `string`) => `void` ;                                                                                                                             |
| `messageRequeued`       | (`messageId`: `string`, `queue`: [`IQueueParams`](interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` ;                                                                                               |
| `messageUnacknowledged` | (`cause`: [`EConsumeMessageUnacknowledgedCause`](enums/EConsumeMessageUnacknowledgedCause.md), `messageId`: `string`, `queue`: [`IQueueParams`](interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` ; |

---

### TTopicParams

Ƭ **TTopicParams**: `Object`

#### Type declaration


| Name    | Type     |
| :-------- | :--------- |
| `ns`    | `string` |
| `topic` | `string` |

## Functions

### disconnect

▸ **disconnect**(`cb`): `void`

#### Parameters


| Name | Type                  |
| :----- | :---------------------- |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`
