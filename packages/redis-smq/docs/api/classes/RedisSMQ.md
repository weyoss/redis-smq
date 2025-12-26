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
  if (err) return console.error('Consumer failed to start:', err);
  // Consumer is ready to receive messages
});
```

---

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
  if (err) return console.error('Failed to save group:', err);
  console.log('Group saved, code:', result);
});
```

---

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
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: 'localhost', port: 6379 },
  },
  (err) => {
    if (err) return console.error('Init failed:', err);

    const directExchange = RedisSMQ.createDirectExchange();
    directExchange.bindQueue(
      'order-queue',
      {
        exchange: 'orders',
        routingKey: 'order.created',
      },
      (bindErr) => {
        if (bindErr) return console.error('Failed to bind queue:', bindErr);
        console.log('Queue bound to direct exchange');
      },
    );
  },
);
```

---

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
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: 'localhost', port: 6379 },
  },
  (err) => {
    if (err) return console.error('Init failed:', err);

    const fanoutExchange = RedisSMQ.createFanoutExchange();
    fanoutExchange.saveExchange('notifications', (saveErr) => {
      if (saveErr) return console.error('Failed to save exchange:', saveErr);
      console.log('Fanout exchange saved');
    });
  },
);
```

---

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
  if (err) return console.error('Failed to get message:', err);
  console.log('Message:', message);
});
```

---

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
  if (err) return console.error('Failed to get namespaces:', err);
  console.log('Namespaces:', namespaces);
});
```

---

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
  if (err) return console.error('Producer failed to start:', err);
  // Producer is ready to send messages
});
```

---

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
  if (err) return console.error('Failed to count acknowledged:', err);
  console.log('Acknowledged count:', count);
});
```

---

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
  if (err) return console.error('Failed to count DLQ:', err);
  console.log('Dead-lettered count:', count);
});
```

---

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
import { EQueueType, EQueueDeliveryModel } from 'redis-smq';

const queueManager = RedisSMQ.createQueueManager();
queueManager.save(
  'my-queue',
  EQueueType.LIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err, result) => {
    if (err) return console.error('Failed to create queue:', err);
    console.log('Queue created:', result);
  },
);
```

---

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
  if (err) return console.error('Failed to count messages:', err);
  console.log('Counts:', count);
});
```

---

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
pendingMessages.countMessages('my-queue', (err, count) => {
  if (err) return console.error('Failed to count pending:', err);
  console.log('Pending count:', count);
});
```

---

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
queueRateLimit.set('my-queue', { interval: 1000, limit: 10 }, (err) => {
  if (err) return console.error('Failed to set rate limit:', err);
  console.log('Rate limit set');
});
```

---

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
  if (err) return console.error('Failed to count scheduled:', err);
  console.log('Scheduled count:', count);
});
```

---

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
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: 'localhost', port: 6379 },
  },
  (err) => {
    if (err) return console.error('Init failed:', err);

    const topicExchange = RedisSMQ.createTopicExchange();
    topicExchange.bindQueue(
      'user-queue',
      {
        exchange: 'user-events',
        routingKey: 'user.*.created',
      },
      (bindErr) => {
        if (bindErr) return console.error('Failed to bind queue:', bindErr);
        console.log('Queue bound to topic exchange');
      },
    );
  },
);
```

---

### getConfigurationInstance()

> `static` **getConfigurationInstance**(): [`Configuration`](Configuration.md)

Gets the current Configuration instance.

#### Returns

[`Configuration`](Configuration.md)

The current Configuration instance

#### Throws

Error if RedisSMQ is not initialized

---

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
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: 'localhost',
      port: 6379,
      db: 0,
    },
  },
  (err) => {
    if (err) {
      console.error('Failed to initialize RedisSMQ:', err);
      return;
    }
    console.log('RedisSMQ initialized successfully');

    // Now you can create producers and consumers without Redis config!
    const producer = RedisSMQ.createProducer();
    const consumer = RedisSMQ.createConsumer();

    producer.run((e) => {
      if (e) return console.error('Producer failed to start:', e);
      console.log('Producer ready');
    });

    consumer.run((e) => {
      if (e) return console.error('Consumer failed to start:', e);
      console.log('Consumer ready');
    });
  },
);
```

---

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
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

RedisSMQ.initializeWithConfig(
  {
    namespace: 'my-custom-app',
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: {
        host: 'localhost',
        port: 6379,
        db: 0,
      },
    },
    logger: {
      enabled: true,
    },
    eventBus: { enabled: true },
  },
  (err) => {
    if (err) {
      console.error('Failed to initialize RedisSMQ:', err);
    } else {
      console.log('RedisSMQ initialized with custom configuration');
    }
  },
);
```

---

### isInitialized()

> `static` **isInitialized**(): `boolean`

Checks if RedisSMQ has been initialized.

#### Returns

`boolean`

True if initialized, false otherwise

---

### reset()

> `static` **reset**(`cb`): `void`

Resets RedisSMQ initialization state.
Useful for testing or reconfiguration.

#### Parameters

##### cb

`ICallback` = `...`

#### Returns

`void`

---

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

---

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
  if (err) return console.error('Failed to start consumer:', err);
  consumer.consume(
    'my-queue',
    (message, done) => {
      // handle message ...
      done();
    },
    (consumeErr) => {
      if (consumeErr)
        return console.error('Failed to start consumption:', consumeErr);
      console.log('Consumer is consuming messages');
    },
  );
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
  if (err) return console.error('Failed to start consumer:', err);
  consumer.consume(
    'my-queue',
    (message, done) => {
      // handle message ...
      done();
    },
    (consumeErr) => {
      if (consumeErr)
        return console.error('Failed to start consumption:', consumeErr);
      console.log('Consumer is consuming messages');
    },
  );
});
```

---

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
  if (err) return console.error('Failed to start producer:', err);
  producer.produce(message, (produceErr, messageIds) => {
    if (produceErr) return console.error('Failed to produce:', produceErr);
    console.log('Message sent:', messageIds);
  });
});
```
