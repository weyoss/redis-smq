[RedisSMQ](../../README.md) / [Docs](../README.md) / API Reference

# API Reference

## Namespaces

- [errors](namespaces/errors/README.md)

## Enumerations

- [EExchangeProperty](enumerations/EExchangeProperty.md)
- [EExchangeQueuePolicy](enumerations/EExchangeQueuePolicy.md)
- [EExchangeType](enumerations/EExchangeType.md)
- [EMessagePriority](enumerations/EMessagePriority.md)
- [EMessageProperty](enumerations/EMessageProperty.md)
- [EMessagePropertyStatus](enumerations/EMessagePropertyStatus.md)
- [EQueueDeliveryModel](enumerations/EQueueDeliveryModel.md)
- [EQueueProperty](enumerations/EQueueProperty.md)
- [EQueueType](enumerations/EQueueType.md)

## Classes

- [Configuration](classes/Configuration.md)
- [Consumer](classes/Consumer.md)
- [ConsumerGroups](classes/ConsumerGroups.md)
- [EventBus](classes/EventBus.md)
- [Exchange](classes/Exchange.md)
- [ExchangeDirect](classes/ExchangeDirect.md)
- [ExchangeFanout](classes/ExchangeFanout.md)
- [ExchangeTopic](classes/ExchangeTopic.md)
- [MessageManager](classes/MessageManager.md)
- [NamespaceManager](classes/NamespaceManager.md)
- [Producer](classes/Producer.md)
- [ProducibleMessage](classes/ProducibleMessage.md)
- [QueueAcknowledgedMessages](classes/QueueAcknowledgedMessages.md)
- [QueueDeadLetteredMessages](classes/QueueDeadLetteredMessages.md)
- [QueueManager](classes/QueueManager.md)
- [QueueMessages](classes/QueueMessages.md)
- [QueuePendingMessages](classes/QueuePendingMessages.md)
- [QueueRateLimit](classes/QueueRateLimit.md)
- [QueueScheduledMessages](classes/QueueScheduledMessages.md)
- [RedisSMQ](classes/RedisSMQ.md)

## Interfaces

- [IConsumerMessageHandlerParams](interfaces/IConsumerMessageHandlerParams.md)
- [IEventBusConfig](interfaces/IEventBusConfig.md)
- [IExchangeParams](interfaces/IExchangeParams.md)
- [IExchangeParsedParams](interfaces/IExchangeParsedParams.md)
- [IExchangeProperties](interfaces/IExchangeProperties.md)
- [IMessageManagerDeleteResponse](interfaces/IMessageManagerDeleteResponse.md)
- [IMessageParams](interfaces/IMessageParams.md)
- [IMessagesConfig](interfaces/IMessagesConfig.md)
- [IMessagesParsedConfig](interfaces/IMessagesParsedConfig.md)
- [IMessagesStorageConfig](interfaces/IMessagesStorageConfig.md)
- [IMessagesStorageConfigOptions](interfaces/IMessagesStorageConfigOptions.md)
- [IMessagesStorageParsedConfig](interfaces/IMessagesStorageParsedConfig.md)
- [IMessagesStorageParsedConfigOptions](interfaces/IMessagesStorageParsedConfigOptions.md)
- [IMessageStateTransferable](interfaces/IMessageStateTransferable.md)
- [IMessageTransferable](interfaces/IMessageTransferable.md)
- [IPaginationPage](interfaces/IPaginationPage.md)
- [IQueueConsumerGroupParams](interfaces/IQueueConsumerGroupParams.md)
- [IQueueExplorer](interfaces/IQueueExplorer.md)
- [IQueueGroupConsumersPendingCount](interfaces/IQueueGroupConsumersPendingCount.md)
- [IQueueMessagesCount](interfaces/IQueueMessagesCount.md)
- [IQueueParams](interfaces/IQueueParams.md)
- [IQueueParsedParams](interfaces/IQueueParsedParams.md)
- [IQueueProperties](interfaces/IQueueProperties.md)
- [IQueueRateLimit](interfaces/IQueueRateLimit.md)
- [IRedisSMQConfig](interfaces/IRedisSMQConfig.md)
- [IRedisSMQDefaultConfig](interfaces/IRedisSMQDefaultConfig.md)
- [IRedisSMQParsedConfig](interfaces/IRedisSMQParsedConfig.md)

## Type Aliases

- [IPaginationPageParams](type-aliases/IPaginationPageParams.md)
- [TConsumerConsumeMessageEvent](type-aliases/TConsumerConsumeMessageEvent.md)
- [TConsumerDequeueMessageEvent](type-aliases/TConsumerDequeueMessageEvent.md)
- [TConsumerEvent](type-aliases/TConsumerEvent.md)
- [TConsumerHeartbeatEvent](type-aliases/TConsumerHeartbeatEvent.md)
- [TConsumerMessageHandler](type-aliases/TConsumerMessageHandler.md)
- [TConsumerMessageHandlerEvent](type-aliases/TConsumerMessageHandlerEvent.md)
- [TConsumerMessageHandlerFn](type-aliases/TConsumerMessageHandlerFn.md)
- [TConsumerMessageHandlerRunnerEvent](type-aliases/TConsumerMessageHandlerRunnerEvent.md)
- [TEventBusEvent](type-aliases/TEventBusEvent.md)
- [TMessageConsumeOptions](type-aliases/TMessageConsumeOptions.md)
- [TMessageDeleteRawResponse](type-aliases/TMessageDeleteRawResponse.md)
- [TMessageDeleteStatus](type-aliases/TMessageDeleteStatus.md)
- [TMessageStateProperty](type-aliases/TMessageStateProperty.md)
- [TMessageStatePropertyKey](type-aliases/TMessageStatePropertyKey.md)
- [TMessageStatePropertyType](type-aliases/TMessageStatePropertyType.md)
- [TProducerEvent](type-aliases/TProducerEvent.md)
- [TQueueConsumer](type-aliases/TQueueConsumer.md)
- [TQueueEvent](type-aliases/TQueueEvent.md)
- [TQueueExtendedParams](type-aliases/TQueueExtendedParams.md)
- [TRedisSMQEvent](type-aliases/TRedisSMQEvent.md)

## Variables

- [defaultConfig](variables/defaultConfig.md)
- [MessageStatePropertyMap](variables/MessageStatePropertyMap.md)

## Functions

- [parseConfig](functions/parseConfig.md)
