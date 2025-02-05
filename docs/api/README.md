[RedisSMQ](../../README.md) / [Docs](../README.md) / API Reference

# API Reference

## Table of contents

### Enumerations

- [EExchangeType](enums/EExchangeType.md)
- [EMessagePriority](enums/EMessagePriority.md)
- [EMessageProperty](enums/EMessageProperty.md)
- [EMessagePropertyStatus](enums/EMessagePropertyStatus.md)
- [EMessageUnknowledgmentAction](enums/EMessageUnknowledgmentAction.md)
- [EMessageUnknowledgmentDeadLetterReason](enums/EMessageUnknowledgmentDeadLetterReason.md)
- [EMessageUnknowledgmentReason](enums/EMessageUnknowledgmentReason.md)
- [EQueueDeliveryModel](enums/EQueueDeliveryModel.md)
- [EQueueProperty](enums/EQueueProperty.md)
- [EQueueType](enums/EQueueType.md)

### Classes

- [Configuration](classes/Configuration.md)
- [Consumer](classes/Consumer.md)
- [ConsumerGroups](classes/ConsumerGroups.md)
- [EventBusRedisInstance](classes/EventBusRedisInstance.md)
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

### Error Classes

- [ConfigurationError](classes/ConfigurationError.md)
- [ConfigurationMessageQueueSizeError](classes/ConfigurationMessageQueueSizeError.md)
- [ConfigurationMessageStoreExpireError](classes/ConfigurationMessageStoreExpireError.md)
- [ConfigurationNamespaceError](classes/ConfigurationNamespaceError.md)
- [ConsumerConsumeMessageHandlerAlreadyExistsError](classes/ConsumerConsumeMessageHandlerAlreadyExistsError.md)
- [ConsumerConsumerGroupIdNotSupportedError](classes/ConsumerConsumerGroupIdNotSupportedError.md)
- [ConsumerConsumerGroupIdRequiredError](classes/ConsumerConsumerGroupIdRequiredError.md)
- [ConsumerError](classes/ConsumerError.md)
- [ConsumerGroupsConsumerGroupNotEmptyError](classes/ConsumerGroupsConsumerGroupNotEmptyError.md)
- [ConsumerGroupsConsumerGroupsNotSupportedError](classes/ConsumerGroupsConsumerGroupsNotSupportedError.md)
- [ConsumerGroupsError](classes/ConsumerGroupsError.md)
- [ConsumerGroupsInvalidGroupIdError](classes/ConsumerGroupsInvalidGroupIdError.md)
- [ConsumerGroupsQueueNotFoundError](classes/ConsumerGroupsQueueNotFoundError.md)
- [EventBusInstanceLockError](classes/EventBusInstanceLockError.md)
- [ExchangeError](classes/ExchangeError.md)
- [ExchangeFanOutError](classes/ExchangeFanOutError.md)
- [ExchangeFanOutExchangeHasBoundQueuesError](classes/ExchangeFanOutExchangeHasBoundQueuesError.md)
- [ExchangeFanOutQueueTypeError](classes/ExchangeFanOutQueueTypeError.md)
- [ExchangeInvalidFanOutParamsError](classes/ExchangeInvalidFanOutParamsError.md)
- [ExchangeInvalidQueueParamsError](classes/ExchangeInvalidQueueParamsError.md)
- [ExchangeInvalidTopicParamsError](classes/ExchangeInvalidTopicParamsError.md)
- [ExchangeQueueIsNotBoundToExchangeError](classes/ExchangeQueueIsNotBoundToExchangeError.md)
- [MessageDestinationQueueAlreadySetError](classes/MessageDestinationQueueAlreadySetError.md)
- [MessageDestinationQueueRequiredError](classes/MessageDestinationQueueRequiredError.md)
- [MessageError](classes/MessageError.md)
- [MessageInvalidParametersError](classes/MessageInvalidParametersError.md)
- [MessageMessageExchangeRequiredError](classes/MessageMessageExchangeRequiredError.md)
- [MessageMessageInProcessError](classes/MessageMessageInProcessError.md)
- [MessageMessageNotDeletedError](classes/MessageMessageNotDeletedError.md)
- [MessageMessageNotFoundError](classes/MessageMessageNotFoundError.md)
- [MessageMessageNotRequeuableError](classes/MessageMessageNotRequeuableError.md)
- [MessageMessagePropertyError](classes/MessageMessagePropertyError.md)
- [NamespaceError](classes/NamespaceError.md)
- [NamespaceInvalidNamespaceError](classes/NamespaceInvalidNamespaceError.md)
- [NamespaceNotFoundError](classes/NamespaceNotFoundError.md)
- [ProducerError](classes/ProducerError.md)
- [ProducerExchangeNoMatchedQueueError](classes/ProducerExchangeNoMatchedQueueError.md)
- [ProducerInstanceNotRunningError](classes/ProducerInstanceNotRunningError.md)
- [ProducerMessageExchangeRequiredError](classes/ProducerMessageExchangeRequiredError.md)
- [ProducerMessagePriorityRequiredError](classes/ProducerMessagePriorityRequiredError.md)
- [ProducerPriorityQueuingNotEnabledError](classes/ProducerPriorityQueuingNotEnabledError.md)
- [ProducerQueueMissingConsumerGroupsError](classes/ProducerQueueMissingConsumerGroupsError.md)
- [ProducerQueueNotFoundError](classes/ProducerQueueNotFoundError.md)
- [ProducerScheduleInvalidParametersError](classes/ProducerScheduleInvalidParametersError.md)
- [ProducerUnknownQueueTypeError](classes/ProducerUnknownQueueTypeError.md)
- [QueueError](classes/QueueError.md)
- [QueueInvalidQueueParameterError](classes/QueueInvalidQueueParameterError.md)
- [QueueMessagesConsumerGroupIdNotSupportedError](classes/QueueMessagesConsumerGroupIdNotSupportedError.md)
- [QueueMessagesConsumerGroupIdRequiredError](classes/QueueMessagesConsumerGroupIdRequiredError.md)
- [QueueMessagesError](classes/QueueMessagesError.md)
- [QueueQueueExistsError](classes/QueueQueueExistsError.md)
- [QueueQueueHasRunningConsumersError](classes/QueueQueueHasRunningConsumersError.md)
- [QueueQueueNotEmptyError](classes/QueueQueueNotEmptyError.md)
- [QueueQueueNotFoundError](classes/QueueQueueNotFoundError.md)
- [QueueRateLimitError](classes/QueueRateLimitError.md)
- [QueueRateLimitInvalidIntervalError](classes/QueueRateLimitInvalidIntervalError.md)
- [QueueRateLimitInvalidLimitError](classes/QueueRateLimitInvalidLimitError.md)
- [QueueRateLimitQueueNotFoundError](classes/QueueRateLimitQueueNotFoundError.md)

### Interfaces

- [IConsumerHeartbeat](interfaces/IConsumerHeartbeat.md)
- [IConsumerHeartbeatPayload](interfaces/IConsumerHeartbeatPayload.md)
- [IConsumerMessageHandlerArgs](interfaces/IConsumerMessageHandlerArgs.md)
- [IEventBusConfig](interfaces/IEventBusConfig.md)
- [IExchange](interfaces/IExchange.md)
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
- [IQueueParams](interfaces/IQueueParams.md)
- [IQueueParsedParams](interfaces/IQueueParsedParams.md)
- [IQueueProperties](interfaces/IQueueProperties.md)
- [IQueueRateLimit](interfaces/IQueueRateLimit.md)
- [IRedisSMQConfig](interfaces/IRedisSMQConfig.md)
- [IRedisSMQConfigRequired](interfaces/IRedisSMQConfigRequired.md)
- [ITopicParams](interfaces/ITopicParams.md)

### Type Aliases

- [IConsumerMessageHandlerWorkerPayload](README.md#iconsumermessagehandlerworkerpayload)
- [IQueueMessagesPageParams](README.md#iqueuemessagespageparams)
- [TConsumerConsumeMessageEvent](README.md#tconsumerconsumemessageevent)
- [TConsumerDequeueMessageEvent](README.md#tconsumerdequeuemessageevent)
- [TConsumerEvent](README.md#tconsumerevent)
- [TConsumerHeartbeatEvent](README.md#tconsumerheartbeatevent)
- [TConsumerMessageHandler](README.md#tconsumermessagehandler)
- [TConsumerMessageHandlerEvent](README.md#tconsumermessagehandlerevent)
- [TConsumerMessageHandlerFn](README.md#tconsumermessagehandlerfn)
- [TConsumerMessageHandlerRunnerEvent](README.md#tconsumermessagehandlerrunnerevent)
- [TEventBusEvent](README.md#teventbusevent)
- [TExchangeDirectTransferable](README.md#texchangedirecttransferable)
- [TExchangeFanOutTransferable](README.md#texchangefanouttransferable)
- [TExchangeTopicTransferable](README.md#texchangetopictransferable)
- [TExchangeTransferable](README.md#texchangetransferable)
- [TMessageConsumeOptions](README.md#tmessageconsumeoptions)
- [TMessageUnacknowledgmentStatus](README.md#tmessageunacknowledgmentstatus)
- [TMessageUnknowledgmentAction](README.md#tmessageunknowledgmentaction)
- [TProducerEvent](README.md#tproducerevent)
- [TQueueConsumer](README.md#tqueueconsumer)
- [TQueueEvent](README.md#tqueueevent)
- [TQueueExtendedParams](README.md#tqueueextendedparams)
- [TQueueMessagesPaginationParams](README.md#tqueuemessagespaginationparams)
- [TQueueMessagesParams](README.md#tqueuemessagesparams)
- [TRedisSMQEvent](README.md#tredissmqevent)

## Type Aliases

### IConsumerMessageHandlerWorkerPayload

Ƭ **IConsumerMessageHandlerWorkerPayload**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `config` | [`IRedisSMQConfigRequired`](interfaces/IRedisSMQConfigRequired.md) |
| `queueParsedParams` | [`IQueueParsedParams`](interfaces/IQueueParsedParams.md) |

___

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

### TConsumerConsumeMessageEvent

Ƭ **TConsumerConsumeMessageEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `consumer.consumeMessage.error` | (`err`: `Error`, `consumerId`: `string`, `queue`: [`IQueueParsedParams`](interfaces/IQueueParsedParams.md)) => `void` |
| `consumer.consumeMessage.messageAcknowledged` | (`messageId`: `string`, `queue`: [`IQueueParsedParams`](interfaces/IQueueParsedParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` |
| `consumer.consumeMessage.messageDeadLettered` | (`messageId`: `string`, `queue`: [`IQueueParsedParams`](interfaces/IQueueParsedParams.md), `messageHandlerId`: `string`, `consumerId`: `string`, `deadLetterReason`: [`EMessageUnknowledgmentDeadLetterReason`](enums/EMessageUnknowledgmentDeadLetterReason.md)) => `void` |
| `consumer.consumeMessage.messageDelayed` | (`messageId`: `string`, `queue`: [`IQueueParsedParams`](interfaces/IQueueParsedParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` |
| `consumer.consumeMessage.messageRequeued` | (`messageId`: `string`, `queue`: [`IQueueParsedParams`](interfaces/IQueueParsedParams.md), `messageHandlerId`: `string`, `consumerId`: `string`) => `void` |
| `consumer.consumeMessage.messageUnacknowledged` | (`messageId`: `string`, `queue`: [`IQueueParsedParams`](interfaces/IQueueParsedParams.md), `messageHandlerId`: `string`, `consumerId`: `string`, `unknowledgmentReason`: [`EMessageUnknowledgmentReason`](enums/EMessageUnknowledgmentReason.md)) => `void` |

___

### TConsumerDequeueMessageEvent

Ƭ **TConsumerDequeueMessageEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `consumer.dequeueMessage.error` | (`err`: `Error`, `consumerId`: `string`, `queue`: [`IQueueParsedParams`](interfaces/IQueueParsedParams.md)) => `void` |
| `consumer.dequeueMessage.messageReceived` | (`messageId`: `string`, `queue`: [`IQueueParsedParams`](interfaces/IQueueParsedParams.md), `consumerId`: `string`) => `void` |
| `consumer.dequeueMessage.nextMessage` | () => `void` |

___

### TConsumerEvent

Ƭ **TConsumerEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `consumer.down` | (`consumerId`: `string`) => `void` |
| `consumer.error` | (`err`: `Error`, `consumerId`: `string`) => `void` |
| `consumer.goingDown` | (`consumerId`: `string`) => `void` |
| `consumer.goingUp` | (`consumerId`: `string`) => `void` |
| `consumer.up` | (`consumerId`: `string`) => `void` |

___

### TConsumerHeartbeatEvent

Ƭ **TConsumerHeartbeatEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `consumerHeartbeat.error` | (`err`: `Error`) => `void` |
| `consumerHeartbeat.heartbeat` | (`consumerId`: `string`, `timestamp`: `number`, `heartbeatPayload`: [`IConsumerHeartbeat`](interfaces/IConsumerHeartbeat.md)) => `void` |

___

### TConsumerMessageHandler

Ƭ **TConsumerMessageHandler**: `string` \| [`TConsumerMessageHandlerFn`](README.md#tconsumermessagehandlerfn)

___

### TConsumerMessageHandlerEvent

Ƭ **TConsumerMessageHandlerEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `consumer.messageHandler.error` | (`err`: `Error`, `consumerId`: `string`, `queue`: [`IQueueParsedParams`](interfaces/IQueueParsedParams.md)) => `void` |

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

### TConsumerMessageHandlerRunnerEvent

Ƭ **TConsumerMessageHandlerRunnerEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `consumer.messageHandlerRunner.error` | (`err`: `Error`, `consumerId`: `string`) => `void` |

___

### TEventBusEvent

Ƭ **TEventBusEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `error` | (`err`: `Error`) => `void` |

___

### TExchangeDirectTransferable

Ƭ **TExchangeDirectTransferable**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `exchangeTag` | `string` |
| `params` | [`IQueueParams`](interfaces/IQueueParams.md) |
| `type` | [`DIRECT`](enums/EExchangeType.md#direct) |

___

### TExchangeFanOutTransferable

Ƭ **TExchangeFanOutTransferable**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `exchangeTag` | `string` |
| `params` | `string` |
| `type` | [`FANOUT`](enums/EExchangeType.md#fanout) |

___

### TExchangeTopicTransferable

Ƭ **TExchangeTopicTransferable**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `exchangeTag` | `string` |
| `params` | [`ITopicParams`](interfaces/ITopicParams.md) |
| `type` | [`TOPIC`](enums/EExchangeType.md#topic) |

___

### TExchangeTransferable

Ƭ **TExchangeTransferable**: [`TExchangeDirectTransferable`](README.md#texchangedirecttransferable) \| [`TExchangeTopicTransferable`](README.md#texchangetopictransferable) \| [`TExchangeFanOutTransferable`](README.md#texchangefanouttransferable)

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

### TMessageUnacknowledgmentStatus

Ƭ **TMessageUnacknowledgmentStatus**: `Record`\<`string`, [`TMessageUnknowledgmentAction`](README.md#tmessageunknowledgmentaction)\>

___

### TMessageUnknowledgmentAction

Ƭ **TMessageUnknowledgmentAction**: \{ `action`: [`REQUEUE`](enums/EMessageUnknowledgmentAction.md#requeue) \| [`DELAY`](enums/EMessageUnknowledgmentAction.md#delay)  } \| \{ `action`: [`DEAD_LETTER`](enums/EMessageUnknowledgmentAction.md#dead_letter) ; `deadLetterReason`: [`EMessageUnknowledgmentDeadLetterReason`](enums/EMessageUnknowledgmentDeadLetterReason.md)  }

___

### TProducerEvent

Ƭ **TProducerEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `producer.down` | (`producerId`: `string`) => `void` |
| `producer.error` | (`err`: `Error`, `producerId`: `string`) => `void` |
| `producer.goingDown` | (`producerId`: `string`) => `void` |
| `producer.goingUp` | (`producerId`: `string`) => `void` |
| `producer.messagePublished` | (`messageId`: `string`, `queue`: [`IQueueParsedParams`](interfaces/IQueueParsedParams.md), `producerId`: `string`) => `void` |
| `producer.up` | (`producerId`: `string`) => `void` |

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

### TQueueEvent

Ƭ **TQueueEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `queue.consumerGroupCreated` | (`queue`: [`IQueueParams`](interfaces/IQueueParams.md), `groupId`: `string`) => `void` |
| `queue.consumerGroupDeleted` | (`queue`: [`IQueueParams`](interfaces/IQueueParams.md), `groupId`: `string`) => `void` |
| `queue.queueCreated` | (`queue`: [`IQueueParams`](interfaces/IQueueParams.md), `properties`: [`IQueueProperties`](interfaces/IQueueProperties.md)) => `void` |
| `queue.queueDeleted` | (`queue`: [`IQueueParams`](interfaces/IQueueParams.md)) => `void` |

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

Ƭ **TRedisSMQEvent**: [`TEventBusEvent`](README.md#teventbusevent) & [`TConsumerEvent`](README.md#tconsumerevent) & [`TConsumerHeartbeatEvent`](README.md#tconsumerheartbeatevent) & [`TConsumerMessageHandlerRunnerEvent`](README.md#tconsumermessagehandlerrunnerevent) & [`TConsumerMessageHandlerEvent`](README.md#tconsumermessagehandlerevent) & [`TConsumerConsumeMessageEvent`](README.md#tconsumerconsumemessageevent) & [`TConsumerDequeueMessageEvent`](README.md#tconsumerdequeuemessageevent) & [`TProducerEvent`](README.md#tproducerevent) & [`TQueueEvent`](README.md#tqueueevent)
