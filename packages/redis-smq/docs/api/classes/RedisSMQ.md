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

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript*
const configManager = RedisSMQ.createConfigManager();
configManager.updateConfig(updates, (err) => {
  // ...
);
```

---

### createConsumer()

> `static` **createConsumer**: (`consumerOptions?`) => [`Consumer`](Consumer.md) = `ConsumerFactory.create`

Creates a new Consumer instance with custom configuration.

#### Parameters

##### consumerOptions?

[`IConsumerOptions`](../interfaces/IConsumerOptions.md)

Configuration options for the consumer

#### Returns

[`Consumer`](Consumer.md)

A new Consumer instance with the specified configuration

#### See

- [IConsumerOptions](../interfaces/IConsumerOptions.md) for all available configuration options
- [Consumer.constructor](Consumer.md#constructor) for detailed documentation

#### Example

```typescript
// Create with default options
const consumer = ConsumerFactory.create();

// Create with custom options
const consumer = ConsumerFactory.create({
  enableMultiplexing: true,
  heartbeatTTL: 60000,
  batchAcks: {
    batchSize: 500,
    batchTimeoutMs: 5000,
  },
});
```

---

### createConsumerGroups()

> `static` **createConsumerGroups**: () => [`ConsumerGroups`](ConsumerGroups.md) = `ConsumerGroupsFactory.create`

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

> `static` **createDirectExchange**: () => [`ExchangeDirect`](ExchangeDirect.md) = `DirectExchangeFactory.create`

Creates a new direct exchange instance.

A direct exchange routes messages to queues based on exact routing key matches.
Messages are delivered to queues whose binding key exactly matches the routing key.

#### Returns

[`ExchangeDirect`](ExchangeDirect.md)

A new direct exchange instance

#### Throws

Error If RedisSMQ is not initialized

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

> `static` **createFanoutExchange**: () => [`ExchangeFanout`](ExchangeFanout.md) = `FanoutExchangeFactory.create`

Creates a new fanout exchange instance.

A fanout exchange routes messages to all queues bound to it, regardless of routing keys.
This is useful for broadcasting messages to multiple consumers.

#### Returns

[`ExchangeFanout`](ExchangeFanout.md)

A new fanout exchange instance

#### Throws

Error If RedisSMQ is not initialized

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

> `static` **createMessageManager**: () => [`MessageManager`](MessageManager.md) = `MessageManagerFactory.create`

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

> `static` **createNamespaceManager**: () => [`NamespaceManager`](NamespaceManager.md) = `NamespaceManagerFactory.create`

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

> `static` **createProducer**: () => [`Producer`](Producer.md) = `ProducerFactory.create`

Creates a Producer instance.

#### Returns

[`Producer`](Producer.md)

A new Producer instance

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript
// Create producer with default settings
const producer = ProducerFactory.create();

// Create and start producer
const producer = ProducerFactory.create();
producer.run((err) => {
  if (err) console.error('Failed to start:', err);
  else console.log('Producer ready');
});
```

---

### createQueueAcknowledgedMessages()

> `static` **createQueueAcknowledgedMessages**: () => [`QueueAcknowledgedMessages`](QueueAcknowledgedMessages.md) = `AcknowledgedMessagesFactory.create`

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

> `static` **createQueueDeadLetteredMessages**: () => [`QueueDeadLetteredMessages`](QueueDeadLetteredMessages.md) = `DeadLetteredMessagesFactory.create`

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

> `static` **createQueueManager**: () => [`QueueManager`](QueueManager.md) = `QueueManagerFactory.create`

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

### createQueuePendingMessages()

> `static` **createQueuePendingMessages**: () => [`QueuePendingMessages`](QueuePendingMessages.md) = `PendingMessagesFactory.create`

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

### createQueuePublishedMessages()

> `static` **createQueuePublishedMessages**: () => [`QueuePublishedMessages`](QueuePublishedMessages.md) = `PublishedMessagesFactory.create`

Creates a QueuePublishedMessages instance.

#### Returns

[`QueuePublishedMessages`](QueuePublishedMessages.md)

A new QueuePublishedMessages instance

#### Throws

Error if RedisSMQ is not initialized

#### Example

```typescript
const publishedMessages = RedisSMQ.createQueuePublishedMessages();
publishedMessages.countMessagesByStatus('my-queue', (err, count) => {
  if (err) return console.error('Failed to count messages:', err);
  console.log('Counts:', count);
});
```

---

### createQueueRateLimit()

> `static` **createQueueRateLimit**: () => [`QueueRateLimit`](QueueRateLimit.md) = `RateLimitFactory.create`

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

> `static` **createQueueScheduledMessages**: () => [`QueueScheduledMessages`](QueueScheduledMessages.md) = `ScheduledMessagesFactory.create`

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

> `static` **createTopicExchange**: () => [`ExchangeTopic`](ExchangeTopic.md) = `TopicExchangeFactory.create`

Creates a new topic exchange instance.

A topic exchange routes messages to queues based on wildcard pattern matching
between the routing key and the binding pattern.

#### Returns

[`ExchangeTopic`](ExchangeTopic.md)

A new topic exchange instance

#### Throws

Error If RedisSMQ is not initialized

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

### initialize()

> `static` **initialize**: \{(): `Promise`\<`void`\>; (`cb`): `void`; (`redisConfig`): `Promise`\<`void`\>; (`redisConfig`, `cb`): `void`; \} = `LifecycleManager.initialize`

#### Call Signature

> (): `Promise`\<`void`\>

Initializes RedisSMQ with optional Redis connection settings.

##### Returns

`Promise`\<`void`\>

A Promise that resolves when initialization completes (if no callback provided),
or `void` if a callback is provided

##### Throws

Thrown when attempting to initialize while shutting down

##### Example

```typescript
// Callback pattern with Redis configuration
LifecycleManager.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: 'localhost',
      port: 6379,
      db: 0,
      password: 'secret',
    },
  },
  (err) => {
    if (err) {
      console.error('Failed to initialize:', err);
      return;
    }
    console.log('RedisSMQ initialized successfully');
  },
);

// Callback pattern without configuration (uses defaults)
LifecycleManager.initialize((err) => {
  if (err) console.error(err);
});

// Promise pattern with configuration
try {
  await LifecycleManager.initialize({
    client: ERedisConfigClient.IOREDIS,
    options: { host: 'localhost', port: 6379 },
  });
  console.log('RedisSMQ initialized successfully');
} catch (err) {
  console.error('Failed to initialize:', err);
}

// Promise pattern without configuration
await LifecycleManager.initialize();
```

#### Call Signature

> (`cb`): `void`

Initializes RedisSMQ with optional Redis connection settings.

##### Parameters

###### cb

`ICallback`

Optional callback function invoked when initialization completes.
The callback receives an error if initialization fails.

##### Returns

`void`

A Promise that resolves when initialization completes (if no callback provided),
or `void` if a callback is provided

##### Throws

Thrown when attempting to initialize while shutting down

##### Example

```typescript
// Callback pattern with Redis configuration
LifecycleManager.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: 'localhost',
      port: 6379,
      db: 0,
      password: 'secret',
    },
  },
  (err) => {
    if (err) {
      console.error('Failed to initialize:', err);
      return;
    }
    console.log('RedisSMQ initialized successfully');
  },
);

// Callback pattern without configuration (uses defaults)
LifecycleManager.initialize((err) => {
  if (err) console.error(err);
});

// Promise pattern with configuration
try {
  await LifecycleManager.initialize({
    client: ERedisConfigClient.IOREDIS,
    options: { host: 'localhost', port: 6379 },
  });
  console.log('RedisSMQ initialized successfully');
} catch (err) {
  console.error('Failed to initialize:', err);
}

// Promise pattern without configuration
await LifecycleManager.initialize();
```

#### Call Signature

> (`redisConfig`): `Promise`\<`void`\>

Initializes RedisSMQ with optional Redis connection settings.

##### Parameters

###### redisConfig

`IRedisConfig`

Optional Redis connection configuration.
If not provided, uses default configuration.

##### Returns

`Promise`\<`void`\>

A Promise that resolves when initialization completes (if no callback provided),
or `void` if a callback is provided

##### Throws

Thrown when attempting to initialize while shutting down

##### Example

```typescript
// Callback pattern with Redis configuration
LifecycleManager.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: 'localhost',
      port: 6379,
      db: 0,
      password: 'secret',
    },
  },
  (err) => {
    if (err) {
      console.error('Failed to initialize:', err);
      return;
    }
    console.log('RedisSMQ initialized successfully');
  },
);

// Callback pattern without configuration (uses defaults)
LifecycleManager.initialize((err) => {
  if (err) console.error(err);
});

// Promise pattern with configuration
try {
  await LifecycleManager.initialize({
    client: ERedisConfigClient.IOREDIS,
    options: { host: 'localhost', port: 6379 },
  });
  console.log('RedisSMQ initialized successfully');
} catch (err) {
  console.error('Failed to initialize:', err);
}

// Promise pattern without configuration
await LifecycleManager.initialize();
```

#### Call Signature

> (`redisConfig`, `cb`): `void`

Initializes RedisSMQ with optional Redis connection settings.

##### Parameters

###### redisConfig

`IRedisConfig`

Optional Redis connection configuration.
If not provided, uses default configuration.

###### cb

`ICallback`

Optional callback function invoked when initialization completes.
The callback receives an error if initialization fails.

##### Returns

`void`

A Promise that resolves when initialization completes (if no callback provided),
or `void` if a callback is provided

##### Throws

Thrown when attempting to initialize while shutting down

##### Example

```typescript
// Callback pattern with Redis configuration
LifecycleManager.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: 'localhost',
      port: 6379,
      db: 0,
      password: 'secret',
    },
  },
  (err) => {
    if (err) {
      console.error('Failed to initialize:', err);
      return;
    }
    console.log('RedisSMQ initialized successfully');
  },
);

// Callback pattern without configuration (uses defaults)
LifecycleManager.initialize((err) => {
  if (err) console.error(err);
});

// Promise pattern with configuration
try {
  await LifecycleManager.initialize({
    client: ERedisConfigClient.IOREDIS,
    options: { host: 'localhost', port: 6379 },
  });
  console.log('RedisSMQ initialized successfully');
} catch (err) {
  console.error('Failed to initialize:', err);
}

// Promise pattern without configuration
await LifecycleManager.initialize();
```

---

### isRunning()

> `static` **isRunning**: () => `boolean` = `LifecycleManager.isRunning`

Checks whether RedisSMQ is currently running.

A running state means the system has been successfully initialized
and is ready to handle operations (e.g., producing/consuming messages).

#### Returns

`boolean`

`true` if RedisSMQ is fully initialized and running, otherwise `false`

#### Example

```typescript
if (LifecycleManager.isRunning()) {
  console.log('RedisSMQ is ready');
} else {
  console.log('RedisSMQ is not initialized');
}
```

---

### shutdown()

> `static` **shutdown**: \{(): `Promise`\<`void`\>; (`cb`): `void`; \} = `LifecycleManager.shutdown`

#### Call Signature

> (): `Promise`\<`void`\>

Gracefully shuts down RedisSMQ and releases all shared resources.

**Important:**

- You should manually shutdown any created components (Producer, Consumer,
  QueueManager, MessageManager, etc.) **before** calling this method to ensure
  all in-flight operations complete and connections are properly released
- If shutdown is already in progress, additional calls are queued
- If initialization is in progress, shutdown will fail with an error
- If the system is already down and no components are registered, shutdown
  completes immediately
- Errors during shutdown of individual components are collected but do not
  prevent other components from shutting down

##### Returns

`Promise`\<`void`\>

A Promise that resolves when shutdown completes (if no callback provided),
or `void` if a callback is provided

##### Throws

Thrown when attempting to shutdown while initialization is in progress

##### Example

```typescript
// Callback pattern
LifecycleManager.shutdown((err) => {
  if (err) {
    console.error('Shutdown failed:', err);
  } else {
    console.log('RedisSMQ shut down successfully');
  }
});

// Promise pattern
try {
  await LifecycleManager.shutdown();
  console.log('RedisSMQ shut down successfully');
} catch (err) {
  console.error('Shutdown failed:', err);
}

// Graceful shutdown with component cleanup
const producer = await Producer.getInstance();
await producer.shutdown(); // Shutdown producer first
await LifecycleManager.shutdown(); // Then shutdown the system
```

#### Call Signature

> (`cb`): `void`

Gracefully shuts down RedisSMQ and releases all shared resources.

**Important:**

- You should manually shutdown any created components (Producer, Consumer,
  QueueManager, MessageManager, etc.) **before** calling this method to ensure
  all in-flight operations complete and connections are properly released
- If shutdown is already in progress, additional calls are queued
- If initialization is in progress, shutdown will fail with an error
- If the system is already down and no components are registered, shutdown
  completes immediately
- Errors during shutdown of individual components are collected but do not
  prevent other components from shutting down

##### Parameters

###### cb

`ICallback`

Optional callback function invoked when shutdown completes.
The callback receives the first error encountered during shutdown,
or `null` if shutdown completed successfully.

##### Returns

`void`

A Promise that resolves when shutdown completes (if no callback provided),
or `void` if a callback is provided

##### Throws

Thrown when attempting to shutdown while initialization is in progress

##### Example

```typescript
// Callback pattern
LifecycleManager.shutdown((err) => {
  if (err) {
    console.error('Shutdown failed:', err);
  } else {
    console.log('RedisSMQ shut down successfully');
  }
});

// Promise pattern
try {
  await LifecycleManager.shutdown();
  console.log('RedisSMQ shut down successfully');
} catch (err) {
  console.error('Shutdown failed:', err);
}

// Graceful shutdown with component cleanup
const producer = await Producer.getInstance();
await producer.shutdown(); // Shutdown producer first
await LifecycleManager.shutdown(); // Then shutdown the system
```

---

### startConsumer()

> `static` **startConsumer**: \{(`consumerOptions?`): `Promise`\<[`Consumer`](Consumer.md)\>; (`consumerOptions`, `cb`): [`Consumer`](Consumer.md); \}

#### Call Signature

> (`consumerOptions?`): `Promise`\<[`Consumer`](Consumer.md)\>

Creates and automatically starts a consumer with custom configuration.

This method creates a consumer and starts it in a single operation.
The consumer is automatically tracked for lifecycle management.

##### Parameters

###### consumerOptions?

[`IConsumerOptions`](../interfaces/IConsumerOptions.md)

Configuration options for the consumer

##### Returns

`Promise`\<[`Consumer`](Consumer.md)\>

The created Consumer instance (started automatically)

##### See

- [Consumer.run](Consumer.md#run) for startup behavior
- [Consumer.consume](Consumer.md#consume) for setting up message handlers after startup

##### Example

```typescript
// Callback pattern
const consumer = ConsumerFactory.startConsumer(
  { enableMultiplexing: true },
  (err) => {
    if (err) {
      console.error('Failed to start:', err);
      return;
    }
    console.log('Consumer started');
    consumer.consume('my-queue', (message, done) => {
      console.log('Processing:', message);
      done();
    });
  },
);

// Promise pattern
try {
  const consumer = await ConsumerFactory.startConsumer({
    enableMultiplexing: true,
    batchAcks: { batchSize: 200 },
  });
  console.log('Consumer started');
  await consumer.consume('orders', (message, done) => {
    console.log('Processing order:', message);
    done();
  });
} catch (err) {
  console.error('Failed to start consumer:', err);
}
```

#### Call Signature

> (`consumerOptions`, `cb`): [`Consumer`](Consumer.md)

Creates and automatically starts a consumer with custom configuration.

This method creates a consumer and starts it in a single operation.
The consumer is automatically tracked for lifecycle management.

##### Parameters

###### consumerOptions

[`IConsumerOptions`](../interfaces/IConsumerOptions.md)

Configuration options for the consumer

###### cb

`ICallback`\<`void`\>

Optional callback invoked when consumer starts or if an error occurs

##### Returns

[`Consumer`](Consumer.md)

The created Consumer instance (started automatically)

##### See

- [Consumer.run](Consumer.md#run) for startup behavior
- [Consumer.consume](Consumer.md#consume) for setting up message handlers after startup

##### Example

```typescript
// Callback pattern
const consumer = ConsumerFactory.startConsumer(
  { enableMultiplexing: true },
  (err) => {
    if (err) {
      console.error('Failed to start:', err);
      return;
    }
    console.log('Consumer started');
    consumer.consume('my-queue', (message, done) => {
      console.log('Processing:', message);
      done();
    });
  },
);

// Promise pattern
try {
  const consumer = await ConsumerFactory.startConsumer({
    enableMultiplexing: true,
    batchAcks: { batchSize: 200 },
  });
  console.log('Consumer started');
  await consumer.consume('orders', (message, done) => {
    console.log('Processing order:', message);
    done();
  });
} catch (err) {
  console.error('Failed to start consumer:', err);
}
```

---

### startProducer()

> `static` **startProducer**: \{(): `Promise`\<[`Producer`](Producer.md)\>; (`cb`): [`Producer`](Producer.md); \}

#### Call Signature

> (): `Promise`\<[`Producer`](Producer.md)\>

Convenience method to create and start a producer in one call.

##### Returns

`Promise`\<[`Producer`](Producer.md)\>

The created Producer instance (started automatically)

##### Example

```typescript
// Callback pattern
const producer = ProducerFactory.startProducer((err) => {
  if (err) {
    console.error('Failed to start producer:', err);
    return;
  }
  console.log('Producer started');
  producer.produce(message, (produceErr, messageIds) => {
    if (produceErr) console.error('Failed to produce:', produceErr);
    else console.log('Message sent:', messageIds);
  });
});

// Promise pattern
try {
  const producer = await ProducerFactory.startProducer();
  console.log('Producer started');
  const messageIds = await producer.produce(message);
  console.log('Message sent:', messageIds);
} catch (err) {
  console.error('Failed to start producer or send message:', err);
}
```

#### Call Signature

> (`cb`): [`Producer`](Producer.md)

Convenience method to create and start a producer in one call.

##### Parameters

###### cb

`ICallback`

Optional callback function called when producer is ready or if an error occurs

##### Returns

[`Producer`](Producer.md)

The created Producer instance (started automatically)

##### Example

```typescript
// Callback pattern
const producer = ProducerFactory.startProducer((err) => {
  if (err) {
    console.error('Failed to start producer:', err);
    return;
  }
  console.log('Producer started');
  producer.produce(message, (produceErr, messageIds) => {
    if (produceErr) console.error('Failed to produce:', produceErr);
    else console.log('Message sent:', messageIds);
  });
});

// Promise pattern
try {
  const producer = await ProducerFactory.startProducer();
  console.log('Producer started');
  const messageIds = await producer.produce(message);
  console.log('Message sent:', messageIds);
} catch (err) {
  console.error('Failed to start producer or send message:', err);
}
```
