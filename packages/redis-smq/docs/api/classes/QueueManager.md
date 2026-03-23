[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / QueueManager

# Class: QueueManager

The QueueManager class represents an interface that interacts with Redis for storing
and managing queues.
It provides functionality to create, check existence, delete, retrieve
properties of queues, and manage shutdown operations.

## Example

```typescript
const queueManager = new QueueManager();

// Using callback
queueManager.getQueues((err, queues) => {
  if (err) {
    console.error('Failed to get queues:', err);
  } else {
    console.log('Queues:', queues);
  }
});

// Using promise
const queues = await queueManager.getQueues();
console.log('Queues:', queues);
```

## Constructors

### Constructor

> **new QueueManager**(): `QueueManager`

#### Returns

`QueueManager`

## Methods

### delete()

#### Call Signature

> **delete**(`queue`): `Promise`\<`void`\>

Deletes a specific queue.

This method removes a queue and all its associated data from the system.
The deletion process is comprehensive and includes validation checks to
ensure the queue can be safely deleted.

##### Parameters

###### queue

The name or parameters for the queue to be deleted

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When the queue has messages.

##### Throws

When there are active consumers.

##### Throws

When exchanges are bound to the queue.

##### Throws

When consumer set is inconsistent.

##### Throws

When the queue is locked.

##### Throws

When the queue is in an invalid state.

##### Throws

When Redis returns an unexpected response.

##### Example

```typescript
const queueManager = new QueueManager();

// Callback pattern
queueManager.delete('old-queue', (err) => {
  if (err) {
    console.error('Failed to delete queue:', err);
  } else {
    console.log('Queue deleted successfully');
  }
});

// Promise pattern
async function safeDeleteQueue(queueName: string) {
  try {
    await queueManager.delete(queueName);
    console.log('Queue deleted successfully');
  } catch (err) {
    console.error('Failed to delete queue:', err);
  }
}
```

#### Call Signature

> **delete**(`queue`, `cb`): `void`

Deletes a specific queue.

This method removes a queue and all its associated data from the system.
The deletion process is comprehensive and includes validation checks to
ensure the queue can be safely deleted.

##### Parameters

###### queue

The name or parameters for the queue to be deleted

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`

Optional callback function to handle success or error. - On success: `cb(null)` - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves when deleted.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Throws

When the queue has messages.

##### Throws

When there are active consumers.

##### Throws

When exchanges are bound to the queue.

##### Throws

When consumer set is inconsistent.

##### Throws

When the queue is locked.

##### Throws

When the queue is in an invalid state.

##### Throws

When Redis returns an unexpected response.

##### Example

```typescript
const queueManager = new QueueManager();

// Callback pattern
queueManager.delete('old-queue', (err) => {
  if (err) {
    console.error('Failed to delete queue:', err);
  } else {
    console.log('Queue deleted successfully');
  }
});

// Promise pattern
async function safeDeleteQueue(queueName: string) {
  try {
    await queueManager.delete(queueName);
    console.log('Queue deleted successfully');
  } catch (err) {
    console.error('Failed to delete queue:', err);
  }
}
```

---

### exists()

#### Call Signature

> **exists**(`queue`): `Promise`\<`boolean`\>

Checks if a specified queue exists.

This method determines whether a queue with the given name and namespace
exists in the system. It returns a boolean indicating existence.

**Use Cases:**

- Pre-flight checks before operations
- Validating queue existence in application logic
- Conditional queue creation

##### Parameters

###### queue

The name or parameters for the queue (string name or object with ns/name)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`boolean`\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Example

```typescript
const queueManager = new QueueManager();

// Callback pattern
queueManager.exists('my-queue', (err, exists) => {
  if (err) {
    console.error('Failed to check existence:', err);
  } else if (exists) {
    console.log('Queue exists');
  } else {
    console.log('Queue does not exist');
  }
});

// Promise pattern
const exists = await queueManager.exists({ ns: 'production', name: 'orders' });
if (exists) {
  console.log('Queue exists, proceeding with operation');
} else {
  console.log('Queue does not exist, creating...');
  await queueManager.save(
    'orders',
    EQueueType.FIFO,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
}
```

#### Call Signature

> **exists**(`queue`, `cb`): `void`

Checks if a specified queue exists.

This method determines whether a queue with the given name and namespace
exists in the system. It returns a boolean indicating existence.

**Use Cases:**

- Pre-flight checks before operations
- Validating queue existence in application logic
- Conditional queue creation

##### Parameters

###### queue

The name or parameters for the queue (string name or object with ns/name)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`boolean`\>

Optional callback function to return a boolean indicating existence. - On success: `cb(null, exists)` where exists is true if queue exists. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the boolean.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Example

```typescript
const queueManager = new QueueManager();

// Callback pattern
queueManager.exists('my-queue', (err, exists) => {
  if (err) {
    console.error('Failed to check existence:', err);
  } else if (exists) {
    console.log('Queue exists');
  } else {
    console.log('Queue does not exist');
  }
});

// Promise pattern
const exists = await queueManager.exists({ ns: 'production', name: 'orders' });
if (exists) {
  console.log('Queue exists, proceeding with operation');
} else {
  console.log('Queue does not exist, creating...');
  await queueManager.save(
    'orders',
    EQueueType.FIFO,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
}
```

---

### getConsumerIds()

#### Call Signature

> **getConsumerIds**(`queue`): `Promise`\<`string`[]\>

Retrieves the consumer IDs for a specified queue.

This method returns a simplified list of consumer IDs for a queue,
without the full consumer details. It's useful for quick checks
and when only the consumer IDs are needed.

##### Parameters

###### queue

A string representing the queue name or an IQueueParams object with queue details

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`string`[]\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Example

```typescript
const queueManager = new QueueManager();

// Callback pattern
queueManager.getConsumerIds('my-queue', (err, consumerIds) => {
  if (err) {
    console.error('Failed to get consumer IDs:', err);
  } else {
    console.log(`Consumer IDs: ${consumerIds.join(', ')}`);
    console.log(`Total consumers: ${consumerIds.length}`);
  }
});

// Promise pattern
async function hasActiveConsumers(queueName: string): Promise<boolean> {
  try {
    const consumerIds = await queueManager.getConsumerIds(queueName);
    return consumerIds.length > 0;
  } catch (err) {
    console.error('Failed to check consumers:', err);
    return false;
  }
}
```

#### Call Signature

> **getConsumerIds**(`queue`, `cb`): `void`

Retrieves the consumer IDs for a specified queue.

This method returns a simplified list of consumer IDs for a queue,
without the full consumer details. It's useful for quick checks
and when only the consumer IDs are needed.

##### Parameters

###### queue

A string representing the queue name or an IQueueParams object with queue details

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`string`[]\>

Optional callback function that receives either an error or an array of consumer IDs. - On success: `cb(null, consumerIds)` where consumerIds is an array of consumer IDs. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with consumer IDs.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Example

```typescript
const queueManager = new QueueManager();

// Callback pattern
queueManager.getConsumerIds('my-queue', (err, consumerIds) => {
  if (err) {
    console.error('Failed to get consumer IDs:', err);
  } else {
    console.log(`Consumer IDs: ${consumerIds.join(', ')}`);
    console.log(`Total consumers: ${consumerIds.length}`);
  }
});

// Promise pattern
async function hasActiveConsumers(queueName: string): Promise<boolean> {
  try {
    const consumerIds = await queueManager.getConsumerIds(queueName);
    return consumerIds.length > 0;
  } catch (err) {
    console.error('Failed to check consumers:', err);
    return false;
  }
}
```

---

### getConsumers()

#### Call Signature

> **getConsumers**(`queue`): `Promise`\<`Record`\<`string`, [`TQueueConsumer`](../type-aliases/TQueueConsumer.md)\>\>

Retrieves the consumers for a specified queue.

This method returns detailed information about all consumers currently
connected to and consuming from the specified queue. Each consumer record
includes the consumer ID and metadata about its connection.

##### Parameters

###### queue

A string representing the queue name or an IQueueParams object with queue details

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<`Record`\<`string`, [`TQueueConsumer`](../type-aliases/TQueueConsumer.md)\>\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Example

```typescript
const queueManager = new QueueManager();

// Callback pattern
queueManager.getConsumers('my-queue', (err, consumers) => {
  if (err) {
    console.error('Failed to get consumers:', err);
  } else {
    const consumerCount = Object.keys(consumers).length;
    console.log(`Found ${consumerCount} active consumers:`);

    Object.entries(consumers).forEach(([id, consumer]) => {
      console.log(`  Consumer: ${id}`);
      console.log(`    Started: ${new Date(consumer.startTime)}`);
      console.log(`    Heartbeat: ${consumer.heartbeat}`);
    });
  }
});

// Promise pattern
async function analyzeConsumerDistribution() {
  const queues = await queueManager.getQueues();
  const distribution = {};

  for (const queue of queues) {
    const consumers = await queueManager.getConsumers(queue);
    distribution[`${queue.name}@${queue.ns}`] = Object.keys(consumers).length;
  }

  console.log('Consumer distribution:', distribution);
}
```

#### Call Signature

> **getConsumers**(`queue`, `cb`): `void`

Retrieves the consumers for a specified queue.

This method returns detailed information about all consumers currently
connected to and consuming from the specified queue. Each consumer record
includes the consumer ID and metadata about its connection.

##### Parameters

###### queue

A string representing the queue name or an IQueueParams object with queue details

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<`Record`\<`string`, [`TQueueConsumer`](../type-aliases/TQueueConsumer.md)\>\>

Optional callback function that receives either an error or a record of consumers. - On success: `cb(null, consumers)` where consumers is an object mapping
consumer IDs to consumer details. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with consumers.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Example

```typescript
const queueManager = new QueueManager();

// Callback pattern
queueManager.getConsumers('my-queue', (err, consumers) => {
  if (err) {
    console.error('Failed to get consumers:', err);
  } else {
    const consumerCount = Object.keys(consumers).length;
    console.log(`Found ${consumerCount} active consumers:`);

    Object.entries(consumers).forEach(([id, consumer]) => {
      console.log(`  Consumer: ${id}`);
      console.log(`    Started: ${new Date(consumer.startTime)}`);
      console.log(`    Heartbeat: ${consumer.heartbeat}`);
    });
  }
});

// Promise pattern
async function analyzeConsumerDistribution() {
  const queues = await queueManager.getQueues();
  const distribution = {};

  for (const queue of queues) {
    const consumers = await queueManager.getConsumers(queue);
    distribution[`${queue.name}@${queue.ns}`] = Object.keys(consumers).length;
  }

  console.log('Consumer distribution:', distribution);
}
```

---

### getProperties()

#### Call Signature

> **getProperties**(`queue`): `Promise`\<[`IQueueProperties`](../interfaces/IQueueProperties.md)\>

Retrieves the properties of a specified queue.

##### Parameters

###### queue

The name or parameters for the queue (string name or object with ns/name)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### Returns

`Promise`\<[`IQueueProperties`](../interfaces/IQueueProperties.md)\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Example

```typescript
const queueManager = new QueueManager();

// Callback pattern
queueManager.getProperties('my-queue', (err, properties) => {
  if (err) {
    console.error('Failed to get properties:', err);
  } else {
    console.log('Queue type:', EQueueType[properties.queueType]);
    console.log(
      'Delivery model:',
      EQueueDeliveryModel[properties.deliveryModel],
    );
    console.log('Operational state:', properties.operationalState);
    console.log('Total messages:', properties.messagesCount);
    console.log('Pending:', properties.pendingMessagesCount);
    console.log('Processing:', properties.processingMessagesCount);
  }
});

// Promise pattern
async function monitorQueueHealth(queueName: string) {
  try {
    const props = await queueManager.getProperties(queueName);
    // ...
  } catch (err) {
    console.error('Failed to monitor queue:', err);
  }
}
```

#### Call Signature

> **getProperties**(`queue`, `cb`): `void`

Retrieves the properties of a specified queue.

##### Parameters

###### queue

The name or parameters for the queue (string name or object with ns/name)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### cb

`ICallback`\<[`IQueueProperties`](../interfaces/IQueueProperties.md)\>

Optional callback function to return the queue properties or an error. - On success: `cb(null, properties)` where properties is the queue metadata. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with properties.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the queue parameters are invalid.

##### Throws

When the specified queue doesn't exist.

##### Example

```typescript
const queueManager = new QueueManager();

// Callback pattern
queueManager.getProperties('my-queue', (err, properties) => {
  if (err) {
    console.error('Failed to get properties:', err);
  } else {
    console.log('Queue type:', EQueueType[properties.queueType]);
    console.log(
      'Delivery model:',
      EQueueDeliveryModel[properties.deliveryModel],
    );
    console.log('Operational state:', properties.operationalState);
    console.log('Total messages:', properties.messagesCount);
    console.log('Pending:', properties.pendingMessagesCount);
    console.log('Processing:', properties.processingMessagesCount);
  }
});

// Promise pattern
async function monitorQueueHealth(queueName: string) {
  try {
    const props = await queueManager.getProperties(queueName);
    // ...
  } catch (err) {
    console.error('Failed to monitor queue:', err);
  }
}
```

---

### getQueues()

#### Call Signature

> **getQueues**(): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Fetches all existing queues.

This method returns a list of all queues currently defined in the system,
across all namespaces. Each queue is represented by its parameters including
name and namespace.

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Example

```typescript
const queueManager = new QueueManager();

// Callback pattern
queueManager.getQueues((err, queues) => {
  if (err) {
    console.error('Failed to get queues:', err);
  } else {
    console.log(`Found ${queues.length} queues:`);
    queues.forEach((queue) => {
      console.log(`  - ${queue.name}@${queue.ns}`);
    });
  }
});

// Promise pattern - list all queues with details
async function listAllQueuesWithDetails() {
  try {
    const queues = await queueManager.getQueues();
    console.log(`Total queues: ${queues.length}`);
  } catch (err) {
    console.error('Failed to list queues:', err);
  }
}
```

#### Call Signature

> **getQueues**(`cb`): `void`

Fetches all existing queues.

This method returns a list of all queues currently defined in the system,
across all namespaces. Each queue is represented by its parameters including
name and namespace.

##### Parameters

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Optional callback function to return a list of queues or an error. - On success: `cb(null, queues)` where queues is an array of queue parameters. - On error: `cb(error)` with any Redis or system errors. - If not provided, the method returns a Promise that resolves with the list.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Example

```typescript
const queueManager = new QueueManager();

// Callback pattern
queueManager.getQueues((err, queues) => {
  if (err) {
    console.error('Failed to get queues:', err);
  } else {
    console.log(`Found ${queues.length} queues:`);
    queues.forEach((queue) => {
      console.log(`  - ${queue.name}@${queue.ns}`);
    });
  }
});

// Promise pattern - list all queues with details
async function listAllQueuesWithDetails() {
  try {
    const queues = await queueManager.getQueues();
    console.log(`Total queues: ${queues.length}`);
  } catch (err) {
    console.error('Failed to list queues:', err);
  }
}
```

---

### save()

#### Call Signature

> **save**(`queue`, `queueType`, `deliveryModel`): `Promise`\<\{ `properties`: [`IQueueProperties`](../interfaces/IQueueProperties.md); `queue`: [`IQueueParams`](../interfaces/IQueueParams.md); \}\>

Save a new queue with specified parameters.
Upon success the callback function is invoked with the created queue details.

This method creates a new queue in the system with the specified type and
delivery model. The queue is initially created in the ACTIVE operational state.

##### Parameters

###### queue

The name or parameters for the queue (can be string name or object with ns/name)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### queueType

[`EQueueType`](../enumerations/EQueueType.md)

The type of the queue, defined by EQueueType

###### deliveryModel

[`EQueueDeliveryModel`](../enumerations/EQueueDeliveryModel.md)

The model for message delivery, defined by EQueueDeliveryModel

##### Returns

`Promise`\<\{ `properties`: [`IQueueProperties`](../interfaces/IQueueProperties.md); `queue`: [`IQueueParams`](../interfaces/IQueueParams.md); \}\>

-         Returns a Promise if no callback is provided, otherwise returns void.

##### See

- /packages/redis-smq/docs/api/enumerations/EQueueType.md
- /packages/redis-smq/docs/api/enumerations/EQueueDeliveryModel.md

##### Throws

When the queue parameters are invalid.

##### Throws

When a queue with the same name and namespace already exists.

##### Throws

When Redis returns an unexpected response.

##### Example

```typescript
const queueManager = new QueueManager();

// Callback pattern
queueManager.save(
  { ns: 'production', name: 'orders' },
  EQueueType.FIFO,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err, result) => {
    if (err) {
      console.error('Failed to create queue:', err);
    } else {
      console.log('Queue created:', result.queue);
      console.log('Properties:', result.properties);
    }
  },
);

// Promise pattern
try {
  const result = await queueManager.save(
    'notifications',
    EQueueType.FIFO,
    EQueueDeliveryModel.PUB_SUB,
  );
  console.log(`Queue ${result.queue.name} created successfully`);
} catch (err) {
  console.error('Failed to create queue:', err);
}
```

#### Call Signature

> **save**(`queue`, `queueType`, `deliveryModel`, `cb`): `void`

Save a new queue with specified parameters.
Upon success the callback function is invoked with the created queue details.

This method creates a new queue in the system with the specified type and
delivery model. The queue is initially created in the ACTIVE operational state.

##### Parameters

###### queue

The name or parameters for the queue (can be string name or object with ns/name)

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

###### queueType

[`EQueueType`](../enumerations/EQueueType.md)

The type of the queue, defined by EQueueType

###### deliveryModel

[`EQueueDeliveryModel`](../enumerations/EQueueDeliveryModel.md)

The model for message delivery, defined by EQueueDeliveryModel

###### cb

`ICallback`\<\{ `properties`: [`IQueueProperties`](../interfaces/IQueueProperties.md); `queue`: [`IQueueParams`](../interfaces/IQueueParams.md); \}\>

Optional callback function to handle success or error. - On success: `cb(null, { queue, properties })` where properties include queue metadata. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the result.

##### Returns

`void`

-         Returns a Promise if no callback is provided, otherwise returns void.

##### See

- /packages/redis-smq/docs/api/enumerations/EQueueType.md
- /packages/redis-smq/docs/api/enumerations/EQueueDeliveryModel.md

##### Throws

When the queue parameters are invalid.

##### Throws

When a queue with the same name and namespace already exists.

##### Throws

When Redis returns an unexpected response.

##### Example

```typescript
const queueManager = new QueueManager();

// Callback pattern
queueManager.save(
  { ns: 'production', name: 'orders' },
  EQueueType.FIFO,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err, result) => {
    if (err) {
      console.error('Failed to create queue:', err);
    } else {
      console.log('Queue created:', result.queue);
      console.log('Properties:', result.properties);
    }
  },
);

// Promise pattern
try {
  const result = await queueManager.save(
    'notifications',
    EQueueType.FIFO,
    EQueueDeliveryModel.PUB_SUB,
  );
  console.log(`Queue ${result.queue.name} created successfully`);
} catch (err) {
  console.error('Failed to create queue:', err);
}
```
