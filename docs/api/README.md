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
- [EQueueDeliveryModel](enums/EQueueDeliveryModel.md)
- [EQueueProperty](enums/EQueueProperty.md)
- [EQueueType](enums/EQueueType.md)
- [EWorkerThreadMessageCodeConsume](enums/EWorkerThreadMessageCodeConsume.md)
- [EWorkerThreadMessageCodeExit](enums/EWorkerThreadMessageCodeExit.md)

### Classes

- [Configuration](classes/Configuration.md)
- [Consumer](classes/Consumer.md)
- [ConsumerGroups](classes/ConsumerGroups.md)
- [ExchangeDirect](classes/ExchangeDirect.md)
- [ExchangeFanOut](classes/ExchangeFanOut.md)
- [ExchangeTopic](classes/ExchangeTopic.md)
- [Message](classes/Message.md)
- [Namespace](classes/Namespace.md)
- [Producer](classes/Producer.md)
- [ProducibleMessage](classes/ProducibleMessage.md)
- [Queue](classes/Queue.md)
- [QueueAcknowledgedMessages](classes/QueueAcknowledgedMessages.md)
- [QueueDeadLetteredMessages](classes/QueueDeadLetteredMessages.md)
- [QueueMessages](classes/QueueMessages.md)
- [QueuePendingMessages](classes/QueuePendingMessages.md)
- [QueueRateLimit](classes/QueueRateLimit.md)
- [QueueScheduledMessages](classes/QueueScheduledMessages.md)

### Errors

- [ConsumerError](classes/ConsumerError.md)
- [ConsumerGroupDeleteError](classes/ConsumerGroupDeleteError.md)
- [ConsumerGroupIdNotFoundError](classes/ConsumerGroupIdNotFoundError.md)
- [ConsumerGroupIdNotSupportedError](classes/ConsumerGroupIdNotSupportedError.md)
- [ConsumerGroupIdRequiredError](classes/ConsumerGroupIdRequiredError.md)
- [ConsumerInvalidGroupIdError](classes/ConsumerInvalidGroupIdError.md)
- [ConsumerMessageHandlerAlreadyExistsError](classes/ConsumerMessageHandlerAlreadyExistsError.md)
- [ConsumerMessageHandlerError](classes/ConsumerMessageHandlerError.md)
- [ConsumerMessageHandlerFileError](classes/ConsumerMessageHandlerFileError.md)
- [ConsumerMessageHandlerFilenameExtensionError](classes/ConsumerMessageHandlerFilenameExtensionError.md)
- [ConsumerMessageHandlerWorkerError](classes/ConsumerMessageHandlerWorkerError.md)
- [ExchangeError](classes/ExchangeError.md)
- [ExchangeFanOutError](classes/ExchangeFanOutError.md)
- [ExchangeInvalidDataError](classes/ExchangeInvalidDataError.md)
- [MessageDeleteError](classes/MessageDeleteError.md)
- [MessageDestinationQueueAlreadySetError](classes/MessageDestinationQueueAlreadySetError.md)
- [MessageDestinationQueueRequiredError](classes/MessageDestinationQueueRequiredError.md)
- [MessageError](classes/MessageError.md)
- [MessageExchangeRequiredError](classes/MessageExchangeRequiredError.md)
- [MessageNotFoundError](classes/MessageNotFoundError.md)
- [ProducerError](classes/ProducerError.md)
- [ProducerInstanceNotRunningError](classes/ProducerInstanceNotRunningError.md)
- [ProducerMessageExchangeRequiredError](classes/ProducerMessageExchangeRequiredError.md)
- [ProducerMessageNotPublishedError](classes/ProducerMessageNotPublishedError.md)
- [ProducerMessageNotScheduledError](classes/ProducerMessageNotScheduledError.md)
- [ProducerQueueWithoutConsumerGroupsError](classes/ProducerQueueWithoutConsumerGroupsError.md)
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
- [IExchange](interfaces/IExchange.md)
- [IExchangeSerialized](interfaces/IExchangeSerialized.md)
- [IMessageParams](interfaces/IMessageParams.md)
- [IMessageStateTransferable](interfaces/IMessageStateTransferable.md)
- [IMessageTransferable](interfaces/IMessageTransferable.md)
- [IMessagesConfig](interfaces/IMessagesConfig.md)
- [IMessagesConfigStorage](interfaces/IMessagesConfigStorage.md)
- [IMessagesConfigStorageOptions](interfaces/IMessagesConfigStorageOptions.md)
- [IMessagesConfigStorageOptionsRequired](interfaces/IMessagesConfigStorageOptionsRequired.md)
- [IMessagesConfigStorageRequired](interfaces/IMessagesConfigStorageRequired.md)
- [IQueueConsumerGroupParams](interfaces/IQueueConsumerGroupParams.md)
- [IQueueGroupConsumersPendingCount](interfaces/IQueueGroupConsumersPendingCount.md)
- [IQueueMessages](interfaces/IQueueMessages.md)
- [IQueueMessagesCount](interfaces/IQueueMessagesCount.md)
- [IQueueMessagesPage](interfaces/IQueueMessagesPage.md)
- [IQueueMessagesRequeuable](interfaces/IQueueMessagesRequeuable.md)
- [IQueueParams](interfaces/IQueueParams.md)
- [IQueueParsedParams](interfaces/IQueueParsedParams.md)
- [IQueueProperties](interfaces/IQueueProperties.md)
- [IQueueRateLimit](interfaces/IQueueRateLimit.md)
- [IRedisSMQConfig](interfaces/IRedisSMQConfig.md)
- [IRedisSMQConfigRequired](interfaces/IRedisSMQConfigRequired.md)

### Type Aliases

- [IQueueMessagesPageParams](README.md#iqueuemessagespageparams)
- [TConsumerMessageHandler](README.md#tconsumermessagehandler)
- [TConsumerMessageHandlerFn](README.md#tconsumermessagehandlerfn)
- [TConsumerRedisKeys](README.md#tconsumerrediskeys)
- [TEventListenersConfig](README.md#teventlistenersconfig)
- [TExchange](README.md#texchange)
- [TExchangeDirectBindingParams](README.md#texchangedirectbindingparams)
- [TExchangeFanOutBindingParams](README.md#texchangefanoutbindingparams)
- [TExchangeSerialized](README.md#texchangeserialized)
- [TExchangeTopicBindingParams](README.md#texchangetopicbindingparams)
- [TMessageConsumeOptions](README.md#tmessageconsumeoptions)
- [TQueueConsumer](README.md#tqueueconsumer)
- [TQueueExtendedParams](README.md#tqueueextendedparams)
- [TQueueMessagesPaginationParams](README.md#tqueuemessagespaginationparams)
- [TQueueMessagesParams](README.md#tqueuemessagesparams)
- [TRedisSMQEvent](README.md#tredissmqevent)
- [TTopicParams](README.md#ttopicparams)
- [TWorkerThreadError](README.md#tworkerthreaderror)
- [TWorkerThreadMessage](README.md#tworkerthreadmessage)
- [TWorkerThreadMessageCode](README.md#tworkerthreadmessagecode)

### Functions

- [disconnect](README.md#disconnect)

## Type Aliases

### IQueueMessagesPageParams

Ƭ **IQueueMessagesPageParams**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `currentPage` | `number` |
| `offsetEnd` | `number` |
| `offsetStart` | `number` |
| `totalPages` | `number` |

___

### TConsumerMessageHandler

Ƭ **TConsumerMessageHandler**: `string` \| [`TConsumerMessageHandlerFn`](README.md#tconsumermessagehandlerfn)

___

### TConsumerMessageHandlerFn

Ƭ **TConsumerMessageHandlerFn**: (`msg`: [`IMessageTransferable`](interfaces/IMessageTransferable.md), `cb`: `ICallback`\<`void`\>) => `void`

#### Type declaration

▸ (`msg`, `cb`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `msg` | [`IMessageTransferable`](interfaces/IMessageTransferable.md) |
| `cb` | `ICallback`\<`void`\> |

##### Returns

`void`

___

### TConsumerRedisKeys

Ƭ **TConsumerRedisKeys**: `ReturnType`\<typeof `redisKeys`[``"getConsumerKeys"``]\>

___

### TEventListenersConfig

Ƭ **TEventListenersConfig**: () => [`IEventListener`](interfaces/IEventListener.md)[]

___

### TExchange

Ƭ **TExchange**: [`ExchangeDirect`](classes/ExchangeDirect.md) \| [`ExchangeTopic`](classes/ExchangeTopic.md) \| [`ExchangeFanOut`](classes/ExchangeFanOut.md)

___

### TExchangeDirectBindingParams

Ƭ **TExchangeDirectBindingParams**: [`IQueueParams`](interfaces/IQueueParams.md) \| `string`

___

### TExchangeFanOutBindingParams

Ƭ **TExchangeFanOutBindingParams**: `string`

___

### TExchangeSerialized

Ƭ **TExchangeSerialized**: `ReturnType`\<[`ExchangeDirect`](classes/ExchangeDirect.md)[``"toJSON"``]\> \| `ReturnType`\<[`ExchangeTopic`](classes/ExchangeTopic.md)[``"toJSON"``]\> \| `ReturnType`\<[`ExchangeFanOut`](classes/ExchangeFanOut.md)[``"toJSON"``]\>

___

### TExchangeTopicBindingParams

Ƭ **TExchangeTopicBindingParams**: [`TTopicParams`](README.md#ttopicparams) \| `string`

___

### TMessageConsumeOptions

Ƭ **TMessageConsumeOptions**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `consumeTimeout` | `number` |
| `retryDelay` | `number` |
| `retryThreshold` | `number` |
| `ttl` | `number` |

___

### TQueueConsumer

Ƭ **TQueueConsumer**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `createdAt` | `number` |
| `hostname` | `string` |
| `ipAddress` | `string`[] |
| `pid` | `number` |

___

### TQueueExtendedParams

Ƭ **TQueueExtendedParams**: `string` \| [`IQueueParams`](interfaces/IQueueParams.md) \| [`IQueueConsumerGroupParams`](interfaces/IQueueConsumerGroupParams.md)

___

### TQueueMessagesPaginationParams

Ƭ **TQueueMessagesPaginationParams**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `consumerGroupId?` | `string` \| ``null`` |
| `page` | `number` |
| `pageSize` | `number` |
| `queue` | `string` \| [`IQueueParams`](interfaces/IQueueParams.md) |

___

### TQueueMessagesParams

Ƭ **TQueueMessagesParams**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `consumerGroupId?` | `string` \| ``null`` |
| `queue` | `string` \| [`IQueueParams`](interfaces/IQueueParams.md) |

___

### TRedisSMQEvent

- [`TEvent`](https://github.com/weyoss/redis-smq-common/blob/master/docs/api/README.md#tevent)

  ↳ `TRedisSMQEvent`.

Ƭ **TRedisSMQEvent**


| Event Name              | Arguments                                                                                                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `heartbeatTick`         | (`timestamp`: `number`, `consumerId`: `string`, `heartbeatPayload`: [`IConsumerHeartbeat`](interfaces/IConsumerHeartbeat.md)) => `void` ;                                                                                                      |
| `messageAcknowledged`   | (`messageId`: `string`, `queue`: [`IQueueParams`](interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` ;                                                                                               |
| `messageDeadLettered`   | (`messageId`: `string`, `queue`: [`IQueueParams`](interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`, `cause`: [`EConsumeMessageDeadLetterCause`](enums/EConsumeMessageDeadLetterCause.md)) => `void` ;         |
| `messageDelayed`        | (`messageId`: `string`, `queue`: [`IQueueParams`](interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` ;                                                                                               |
| `messagePublished`      | (`messageId`: `string`, `queue`: [`IQueueParams`](interfaces/IQueueParams.md), `producerId`: `string`) => `void` ;                                                                                                                                                     |
| `messageReceived`       | (`messageId`: `string`, `queue`: [`IQueueParams`](interfaces/IQueueParams.md), `consumerId`: `string`) => `void` ;                                                                                                                             |
| `messageRequeued`       | (`messageId`: `string`, `queue`: [`IQueueParams`](interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` ;                                                                                               |
| `messageUnacknowledged` | (`messageId`: `string`, `queue`: [`IQueueParams`](interfaces/IQueueParams.md), `messageHandlerId`: `string`, `consumerId`: `string`, `cause`: [`EConsumeMessageUnacknowledgedCause`](enums/EConsumeMessageUnacknowledgedCause.md)) => `void` ; |

___

### TTopicParams

Ƭ **TTopicParams**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `ns` | `string` |
| `topic` | `string` |

___

### TWorkerThreadError

Ƭ **TWorkerThreadError**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `name` | `string` |

___

### TWorkerThreadMessage

Ƭ **TWorkerThreadMessage**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `code` | [`TWorkerThreadMessageCode`](README.md#tworkerthreadmessagecode) |
| `error` | [`TWorkerThreadError`](README.md#tworkerthreaderror) \| ``null`` |

___

### TWorkerThreadMessageCode

Ƭ **TWorkerThreadMessageCode**: [`EWorkerThreadMessageCodeExit`](enums/EWorkerThreadMessageCodeExit.md) \| [`EWorkerThreadMessageCodeConsume`](enums/EWorkerThreadMessageCodeConsume.md)

## Functions

### disconnect

▸ **disconnect**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | `ICallback`\<`void`\> |

#### Returns

`void`
