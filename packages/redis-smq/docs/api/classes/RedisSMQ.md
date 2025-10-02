[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / RedisSMQ

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

## Methods

### createConsumer()

> `static` **createConsumer**(`enableMultiplexing?`): [`Consumer`](Consumer.md)

Creates a Consumer instance.

#### Parameters

##### enableMultiplexing?

`boolean`

Optional flag to enable multiplexing

#### Returns

[`Consumer`](Consumer.md)

A new Consumer instance

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript
const consumer = RedisSMQ.createConsumer();
consumer.run((err) => {
  if (!err) {
    // Consumer is ready to receive messages
  }
});
```

***

### createConsumerGroups()

> `static` **createConsumerGroups**(): [`ConsumerGroups`](ConsumerGroups.md)

Creates a ConsumerGroups instance.

#### Returns

[`ConsumerGroups`](ConsumerGroups.md)

A new ConsumerGroups instance

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript
const consumerGroups = RedisSMQ.createConsumerGroups();
consumerGroups.saveConsumerGroup('my-queue', 'group1', (err, result) => {
  // Consumer group saved
});
```

***

### createDirectExchange()

> `static` **createDirectExchange**(): [`ExchangeDirect`](ExchangeDirect.md)

Creates a new direct exchange instance.

A direct exchange routes messages to queues based on exact routing key matches.
Messages are delivered to queues whose binding key exactly matches the routing key.

#### Returns

[`ExchangeDirect`](ExchangeDirect.md)

A new direct exchange instance

#### Throws

If RedisSMQ is not initialized

#### Example

```typescript
// Initialize RedisSMQ first
await RedisSMQ.initialize();

// Create direct exchange
const directExchange = RedisSMQ.createDirectExchange();

// Bind queue with exact routing key
directExchange.bindQueue('order-queue', {
  exchange: 'orders',
  routingKey: 'order.created'
}, (err) => {
  if (err) console.error('Failed to bind queue:', err);
});
```

***

### createFanoutExchange()

> `static` **createFanoutExchange**(): [`ExchangeFanout`](ExchangeFanout.md)

Creates a new fanout exchange instance.

A fanout exchange routes messages to all queues bound to it, regardless of routing keys.
This is useful for broadcasting messages to multiple consumers.

#### Returns

[`ExchangeFanout`](ExchangeFanout.md)

A new fanout exchange instance

#### Throws

If RedisSMQ is not initialized

#### Example

```typescript
// Initialize RedisSMQ first
await RedisSMQ.initialize();

// Create fanout exchange
const fanoutExchange = RedisSMQ.createFanoutExchange();

// Save the exchange
fanoutExchange.saveExchange('notifications', (err) => {
  if (err) console.error('Failed to save exchange:', err);
});
```

***

### createMessageManager()

> `static` **createMessageManager**(): [`MessageManager`](MessageManager.md)

Creates a MessageManager instance.

#### Returns

[`MessageManager`](MessageManager.md)

A new MessageManager instance

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript
const messageManager = RedisSMQ.createMessageManager();
messageManager.getMessageById('message-id', (err, message) => {
  // Retrieved message by ID
});
```

***

### createNamespaceManager()

> `static` **createNamespaceManager**(): [`NamespaceManager`](NamespaceManager.md)

Creates a NamespaceManager instance.

#### Returns

[`NamespaceManager`](NamespaceManager.md)

A new NamespaceManager instance

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript
const namespaceManager = RedisSMQ.createNamespaceManager();
namespaceManager.getNamespaces((err, namespaces) => {
  // Retrieved namespaces
});
```

***

### createProducer()

> `static` **createProducer**(): [`Producer`](Producer.md)

Creates a Producer instance.

#### Returns

[`Producer`](Producer.md)

A new Producer instance

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript
const producer = RedisSMQ.createProducer();
producer.run((err) => {
  if (!err) {
    // Producer is ready to send messages
  }
});
```

***

### createQueueAcknowledgedMessages()

> `static` **createQueueAcknowledgedMessages**(): [`QueueAcknowledgedMessages`](QueueAcknowledgedMessages.md)

Creates a QueueAcknowledgedMessages instance.

#### Returns

[`QueueAcknowledgedMessages`](QueueAcknowledgedMessages.md)

A new QueueAcknowledgedMessages instance

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript
const acknowledgedMessages = RedisSMQ.createQueueAcknowledgedMessages();
acknowledgedMessages.countMessages('my-queue', (err, count) => {
  // Acknowledged message count
});
```

***

### createQueueDeadLetteredMessages()

> `static` **createQueueDeadLetteredMessages**(): [`QueueDeadLetteredMessages`](QueueDeadLetteredMessages.md)

Creates a QueueDeadLetteredMessages instance.

#### Returns

[`QueueDeadLetteredMessages`](QueueDeadLetteredMessages.md)

A new QueueDeadLetteredMessages instance

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript
const deadLetteredMessages = RedisSMQ.createQueueDeadLetteredMessages();
deadLetteredMessages.countMessages('my-queue', (err, count) => {
  // Dead lettered message count
});
```

***

### createQueueManager()

> `static` **createQueueManager**(): [`QueueManager`](QueueManager.md)

Creates a QueueManager instance.

#### Returns

[`QueueManager`](QueueManager.md)

A new QueueManager instance

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript
const queueManager = RedisSMQ.createQueueManager();
queueManager.save('my-queue', EQueueType.LIFO_QUEUE, EQueueDeliveryModel.POINT_TO_POINT, (err, result) => {
  // Queue created
});
```

***

### createQueueMessages()

> `static` **createQueueMessages**(): [`QueueMessages`](QueueMessages.md)

Creates a QueueMessages instance.

#### Returns

[`QueueMessages`](QueueMessages.md)

A new QueueMessages instance

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript
const queueMessages = RedisSMQ.createQueueMessages();
queueMessages.countMessagesByStatus('my-queue', (err, count) => {
  // Message counts by status
});
```

***

### createQueuePendingMessages()

> `static` **createQueuePendingMessages**(): [`QueuePendingMessages`](QueuePendingMessages.md)

Creates a QueuePendingMessages instance.

#### Returns

[`QueuePendingMessages`](QueuePendingMessages.md)

A new QueuePendingMessages instance

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript
const pendingMessages = RedisSMQ.createQueuePendingMessages();
pendingMessages.countMessages({ queue: 'my-queue' }, (err, count) => {
  // Pending message count
});
```

***

### createQueueRateLimit()

> `static` **createQueueRateLimit**(): [`QueueRateLimit`](QueueRateLimit.md)

Creates a QueueRateLimit instance.

#### Returns

[`QueueRateLimit`](QueueRateLimit.md)

A new QueueRateLimit instance

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript
const queueRateLimit = RedisSMQ.createQueueRateLimit();
queueRateLimit.setQueueRateLimit('my-queue', { interval: 1000, limit: 10 }, (err) => {
  // Rate limit set
});
```

***

### createQueueScheduledMessages()

> `static` **createQueueScheduledMessages**(): [`QueueScheduledMessages`](QueueScheduledMessages.md)

Creates a QueueScheduledMessages instance.

#### Returns

[`QueueScheduledMessages`](QueueScheduledMessages.md)

A new QueueScheduledMessages instance

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript
const scheduledMessages = RedisSMQ.createQueueScheduledMessages();
scheduledMessages.countMessages('my-queue', (err, count) => {
  // Scheduled message count
});
```

***

### createTopicExchange()

> `static` **createTopicExchange**(): [`ExchangeTopic`](ExchangeTopic.md)

Creates a new topic exchange instance.

A topic exchange routes messages to queues based on wildcard pattern matching
between the routing key and the binding pattern.

#### Returns

[`ExchangeTopic`](ExchangeTopic.md)

A new topic exchange instance

#### Throws

If RedisSMQ is not initialized

#### Example

```typescript
// Initialize RedisSMQ first
await RedisSMQ.initialize();

// Create topic exchange
const topicExchange = RedisSMQ.createTopicExchange();

// Bind queue with routing pattern
topicExchange.bindQueue('user-queue', {
  exchange: 'user-events',
  routingKey: 'user.*.created'
}, (err) => {
  if (err) console.error('Failed to bind queue:', err);
});
```

***

### getConfigurationInstance()

> `static` **getConfigurationInstance**(): [`Configuration`](Configuration.md)

Gets the current Configuration instance.

#### Returns

[`Configuration`](Configuration.md)

The current Configuration instance

#### Throws

Error if RedisSMQ is not initialized

***

### initialize()

> `static` **initialize**(`redisConfig`, `cb`): `void`

Initializes RedisSMQ with Redis connection settings.
This is the simplest way to get started - just provide Redis connection once.

#### Parameters

##### redisConfig

`IRedisConfig`

Redis connection configuration

##### cb

`ICallback`

Callback function called when initialization completes

#### Returns

`void`

#### Example

```typescript
import { RedisSMQ, ERedisConfigClient } from 'redis-smq';

RedisSMQ.initialize({
  client: ERedisConfigClient.IOREDIS,
  options: {
    host: 'localhost',
    port: 6379,
    db: 0
  }
}, (err) => {
  if (err) {
    console.error('Failed to initialize RedisSMQ:', err);
  } else {
    console.log('RedisSMQ initialized successfully');

    // Now you can create producers and consumers without Redis config!
    const producer = RedisSMQ.createProducer();
    const consumer = RedisSMQ.createConsumer();
  }
});
```

***

### initializeWithConfig()

> `static` **initializeWithConfig**(`redisSMQConfig`, `cb`): `void`

Initializes RedisSMQ with custom RedisSMQ configuration.
This method allows you to provide a complete RedisSMQ configuration that will be saved to Redis.
The Redis connection configuration is extracted from the provided RedisSMQ configuration.

#### Parameters

##### redisSMQConfig

[`IRedisSMQConfig`](../interfaces/IRedisSMQConfig.md)

Complete RedisSMQ configuration including Redis settings

##### cb

`ICallback`

Callback function called when initialization completes

#### Returns

`void`

#### Example

```typescript
import { RedisSMQ, ERedisConfigClient } from 'redis-smq';

RedisSMQ.initializeWithConfig({
  namespace: 'my-custom-app',
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: 'localhost',
      port: 6379,
      db: 0
    }
  },
  logger: {
    enabled: true,
    options: { level: 'debug' }
  },
  eventBus: { enabled: true }
}, (err) => {
  if (err) {
    console.error('Failed to initialize RedisSMQ:', err);
  } else {
    console.log('RedisSMQ initialized with custom configuration');
  }
});
```

***

### isInitialized()

> `static` **isInitialized**(): `boolean`

Checks if RedisSMQ has been initialized.

#### Returns

`boolean`

True if initialized, false otherwise

***

### reset()

> `static` **reset**(): `void`

Resets RedisSMQ initialization state.
Useful for testing or reconfiguration.

#### Returns

`void`

***

### shutdown()

> `static` **shutdown**(`cb`): `void`

Shuts down RedisSMQ and closes shared resources.

This convenience method:
- Gracefully shuts down the Redis connection pool
- Closes the configuration Redis client
- Resets RedisSMQ initialization state

Note: You should still shutdown any created components (e.g. Producer, Consumer,
QueueManagers, MessageManager, etc.) prior to calling this method to ensure all
in-flight operations complete and connections are released back to the pool.

#### Parameters

##### cb

`ICallback`

Callback invoked when shutdown completes

#### Returns

`void`

***

### startConsumer()

#### Call Signature

> `static` **startConsumer**(`enableMultiplexing`, `cb`): [`Consumer`](Consumer.md)

Convenience method to create and start a consumer in one call.

##### Parameters

###### enableMultiplexing

`boolean`

Optional flag to enable multiplexing

###### cb

`ICallback`\<`boolean`\>

Callback function called when consumer is ready

##### Returns

[`Consumer`](Consumer.md)

The created Consumer instance

##### Example

```typescript
const consumer = RedisSMQ.startConsumer(false, (err) => {
  if (!err) {
    consumer.consume('my-queue', messageHandler, (err) => {
      // Consumer is consuming messages
    });
  }
});
```

#### Call Signature

> `static` **startConsumer**(`cb`): [`Consumer`](Consumer.md)

Convenience method to create and start a consumer in one call.

##### Parameters

###### cb

`ICallback`\<`boolean`\>

Callback function called when consumer is ready

##### Returns

[`Consumer`](Consumer.md)

The created Consumer instance

##### Example

```typescript
const consumer = RedisSMQ.startConsumer(false, (err) => {
  if (!err) {
    consumer.consume('my-queue', messageHandler, (err) => {
      // Consumer is consuming messages
    });
  }
});
```

***

### startProducer()

> `static` **startProducer**(`cb`): [`Producer`](Producer.md)

Convenience method to create and start a producer in one call.

#### Parameters

##### cb

`ICallback`\<`boolean`\>

Callback function called when producer is ready

#### Returns

[`Producer`](Producer.md)

The created Producer instance

#### Example

```typescript
const producer = RedisSMQ.startProducer((err) => {
  if (!err) {
    producer.produce(message, (err, messageIds) => {
      // Message sent
    });
  }
});
```
