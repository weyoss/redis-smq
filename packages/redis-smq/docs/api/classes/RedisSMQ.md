[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / RedisSMQ

# Class: RedisSMQ

Main RedisSMQ class providing a simplified API for Redis-based message queue operations.
Handles global Redis connection management and provides factory methods for creating
various queue-related components like producers, consumers, and message managers.
Must be initialized with Redis configuration before use.

## Constructors

### Constructor

> **new RedisSMQ**(): `RedisSMQ`

#### Returns

`RedisSMQ`

## Properties

### createConfigManager()

> `static` **createConfigManager**: () => [`ConfigManager`](ConfigManager.md) = `ConfigManagerFactory.create`

Creates a ConfigManager instance.

#### Returns

[`ConfigManager`](ConfigManager.md)

A new ConfigManager instance

---

### createConsumer()

> `static` **createConsumer**: (`consumerOptions?`) => [`Consumer`](Consumer.md) = `ConsumerFactory.create`

Creates a Consumer instance.

#### Parameters

##### consumerOptions?

[`IConsumerOptions`](../interfaces/IConsumerOptions.md)

Optional configuration options

#### Returns

[`Consumer`](Consumer.md)

A new Consumer instance

---

### createConsumerGroups()

> `static` **createConsumerGroups**: () => [`ConsumerGroups`](ConsumerGroups.md) = `ConsumerGroupsFactory.create`

Creates a ConsumerGroups instance.

#### Returns

[`ConsumerGroups`](ConsumerGroups.md)

A new ConsumerGroups instance

---

### createDirectExchange()

> `static` **createDirectExchange**: () => [`ExchangeDirect`](ExchangeDirect.md) = `DirectExchangeFactory.create`

Creates an ExchangeDirect instance.

#### Returns

[`ExchangeDirect`](ExchangeDirect.md)

A new ExchangeDirect instance

---

### createFanoutExchange()

> `static` **createFanoutExchange**: () => [`ExchangeFanout`](ExchangeFanout.md) = `FanoutExchangeFactory.create`

Creates a new fanout exchange instance.

#### Returns

[`ExchangeFanout`](ExchangeFanout.md)

A new ExchangeFanout instance

---

### createMessageManager()

> `static` **createMessageManager**: () => [`MessageManager`](MessageManager.md) = `MessageManagerFactory.create`

Creates a MessageManager instance.

#### Returns

[`MessageManager`](MessageManager.md)

A new MessageManager instance

---

### createNamespaceManager()

> `static` **createNamespaceManager**: () => [`NamespaceManager`](NamespaceManager.md) = `NamespaceManagerFactory.create`

Creates a NamespaceManager instance.

#### Returns

[`NamespaceManager`](NamespaceManager.md)

A new NamespaceManager instance

---

### createProducer()

> `static` **createProducer**: () => [`Producer`](Producer.md) = `ProducerFactory.create`

Creates a Producer instance.

#### Returns

[`Producer`](Producer.md)

A new Producer instance

---

### createQueueAcknowledgedMessages()

> `static` **createQueueAcknowledgedMessages**: () => [`QueueAcknowledgedMessages`](QueueAcknowledgedMessages.md) = `AcknowledgedMessagesFactory.create`

Creates a QueueAcknowledgedMessages instance.

#### Returns

[`QueueAcknowledgedMessages`](QueueAcknowledgedMessages.md)

A new QueueAcknowledgedMessages instance

---

### createQueueDeadLetteredMessages()

> `static` **createQueueDeadLetteredMessages**: () => [`QueueDeadLetteredMessages`](QueueDeadLetteredMessages.md) = `DeadLetteredMessagesFactory.create`

Creates a QueueDeadLetteredMessages instance.

#### Returns

[`QueueDeadLetteredMessages`](QueueDeadLetteredMessages.md)

A new QueueDeadLetteredMessages instance

---

### createQueueManager()

> `static` **createQueueManager**: () => [`QueueManager`](QueueManager.md) = `QueueManagerFactory.create`

Creates a QueueManager instance.

#### Returns

[`QueueManager`](QueueManager.md)

A new QueueManager instance

---

### createQueuePendingMessages()

> `static` **createQueuePendingMessages**: () => [`QueuePendingMessages`](QueuePendingMessages.md) = `PendingMessagesFactory.create`

Creates a QueuePendingMessages instance.

#### Returns

[`QueuePendingMessages`](QueuePendingMessages.md)

A new QueuePendingMessages instance

---

### createQueuePublishedMessages()

> `static` **createQueuePublishedMessages**: () => [`QueuePublishedMessages`](QueuePublishedMessages.md) = `PublishedMessagesFactory.create`

Creates a QueuePublishedMessages instance.

#### Returns

[`QueuePublishedMessages`](QueuePublishedMessages.md)

A new QueuePublishedMessages instance

---

### createQueueRateLimit()

> `static` **createQueueRateLimit**: () => [`QueueRateLimit`](QueueRateLimit.md) = `RateLimitFactory.create`

Creates a QueueRateLimit instance.

#### Returns

[`QueueRateLimit`](QueueRateLimit.md)

A new QueueRateLimit instance

---

### createQueueScheduledMessages()

> `static` **createQueueScheduledMessages**: () => [`QueueScheduledMessages`](QueueScheduledMessages.md) = `ScheduledMessagesFactory.create`

Creates a QueueScheduledMessages instance.

#### Returns

[`QueueScheduledMessages`](QueueScheduledMessages.md)

A new QueueScheduledMessages instance

---

### createTopicExchange()

> `static` **createTopicExchange**: () => [`ExchangeTopic`](ExchangeTopic.md) = `TopicExchangeFactory.create`

Creates a new topic exchange instance.

#### Returns

[`ExchangeTopic`](ExchangeTopic.md)

A new topic exchange instance

---

### initialize()

> `static` **initialize**: \{(): `Promise`\<`void`\>; (`cb`): `void`; (`redisConfig`): `Promise`\<`void`\>; (`redisConfig`, `cb`): `void`; \} = `LifecycleManager.initialize`

#### Call Signature

> (): `Promise`\<`void`\>

Initializes RedisSMQ.

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

#### Call Signature

> (`cb`): `void`

Initializes RedisSMQ.

##### Parameters

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

#### Call Signature

> (`redisConfig`): `Promise`\<`void`\>

Initializes RedisSMQ.

##### Parameters

###### redisConfig

`IRedisConfig`

Optional Redis configuration

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

#### Call Signature

> (`redisConfig`, `cb`): `void`

Initializes RedisSMQ.

##### Parameters

###### redisConfig

`IRedisConfig`

Optional Redis configuration

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

---

### isRunning()

> `static` **isRunning**: () => `boolean` = `LifecycleManager.isRunning`

Checks if RedisSMQ is currently running.

#### Returns

`boolean`

true if initialized and running

---

### shutdown()

> `static` **shutdown**: \{(): `Promise`\<`void`\>; (`cb`): `void`; \} = `LifecycleManager.shutdown`

#### Call Signature

> (): `Promise`\<`void`\>

Gracefully shuts down RedisSMQ.

##### Returns

`Promise`\<`void`\>

Promise if no callback, otherwise void

#### Call Signature

> (`cb`): `void`

Gracefully shuts down RedisSMQ.

##### Parameters

###### cb

`ICallback`

(err) => void

##### Returns

`void`

Promise if no callback, otherwise void

---

### startConsumer()

> `static` **startConsumer**: \{(`consumerOptions?`): `Promise`\<[`Consumer`](Consumer.md)\>; (`consumerOptions`, `cb`): [`Consumer`](Consumer.md); \}

#### Call Signature

> (`consumerOptions?`): `Promise`\<[`Consumer`](Consumer.md)\>

Creates and starts a Consumer instance.

##### Parameters

###### consumerOptions?

[`IConsumerOptions`](../interfaces/IConsumerOptions.md)

Optional configuration options

##### Returns

`Promise`\<[`Consumer`](Consumer.md)\>

Promise with Consumer if no callback, otherwise Consumer

#### Call Signature

> (`consumerOptions`, `cb`): [`Consumer`](Consumer.md)

Creates and starts a Consumer instance.

##### Parameters

###### consumerOptions

[`IConsumerOptions`](../interfaces/IConsumerOptions.md)

Optional configuration options

###### cb

`ICallback`\<`void`\>

(err) => void. If provided, returns Consumer synchronously

##### Returns

[`Consumer`](Consumer.md)

Promise with Consumer if no callback, otherwise Consumer

---

### startProducer()

> `static` **startProducer**: \{(): `Promise`\<[`Producer`](Producer.md)\>; (`cb`): [`Producer`](Producer.md); \}

#### Call Signature

> (): `Promise`\<[`Producer`](Producer.md)\>

Convenience method to create and start a producer in one call.

##### Returns

`Promise`\<[`Producer`](Producer.md)\>

Promise with Producer if no callback, otherwise Producer

#### Call Signature

> (`cb`): [`Producer`](Producer.md)

Convenience method to create and start a producer in one call.

##### Parameters

###### cb

`ICallback`

(err) => void. If provided, returns Producer synchronously

##### Returns

[`Producer`](Producer.md)

Promise with Producer if no callback, otherwise Producer
