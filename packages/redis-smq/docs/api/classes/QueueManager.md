[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / QueueManager

# Class: QueueManager

The QueueManager class represents an interface that interacts with Redis for storing
and managing queues.
It provides functionality to create, check existence, delete, retrieve
properties of queues, and manage shutdown operations.

## Constructors

### Constructor

> **new QueueManager**(): `QueueManager`

#### Returns

`QueueManager`

## Methods

### delete()

> **delete**(`queue`, `cb`): `void`

Deletes a specific queue.

#### Parameters

##### queue

The name or parameters for the queue to be deleted.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`

Callback function to handle success or error.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

QueueNotFoundError

#### Throws

QueueNotEmptyError

#### Throws

QueueManagerActiveConsumersError

#### Throws

QueueHasBoundExchangesError

#### Throws

ConsumerSetMismatchError

#### Throws

UnexpectedScriptReplyError

---

### exists()

> **exists**(`queue`, `cb`): `void`

Checks if a specified queue exists.

#### Parameters

##### queue

The name or parameters for the queue.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`boolean`\>

Callback function to return a boolean indicating the existence of the queue.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

---

### getConsumerIds()

> **getConsumerIds**(`queue`, `cb`): `void`

Retrieves the consumer IDs for a specified queue.

This function accepts either a queue name (string) or queue parameters (IQueueParams)
and retrieves the associated consumer IDs using the Redis client. The results are passed
to the provided callback function. If any errors occur during parameter parsing or
Redis client operations, they are logged and passed to the callback.

#### Parameters

##### queue

A string representing the queue name or an IQueueParams object with queue details.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`string`[]\>

A callback function that receives either an error or an array of consumer IDs.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

QueueNotFoundError

---

### getConsumers()

> **getConsumers**(`queue`, `cb`): `void`

Retrieves the consumers for a specified queue.

This function accepts either a queue name (string) or queue parameters (IQueueParams)
and retrieves the associated consumers using the Redis client. The results are passed
to the provided callback function. If any errors occur during parameter parsing or
Redis client operations, they are logged and passed to the callback.

#### Parameters

##### queue

A string representing the queue name or an IQueueParams object with queue details.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`Record`\<`string`, [`TQueueConsumer`](../type-aliases/TQueueConsumer.md)\>\>

A callback function that receives either an error or a record of consumers.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

QueueNotFoundError

---

### getProperties()

> **getProperties**(`queue`, `cb`): `void`

Retrieves the properties of a specified queue.

#### Parameters

##### queue

The name or parameters for the queue.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<[`IQueueProperties`](../interfaces/IQueueProperties.md)\>

Callback function to return the queue properties or an error.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

QueueNotFoundError

---

### getQueues()

> **getQueues**(`cb`): `void`

Fetches all existing queues.

#### Parameters

##### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Callback function to return with a list of queues or an error.

#### Returns

`void`

---

### save()

> **save**(`queue`, `queueType`, `deliveryModel`, `cb`): `void`

Save a new queue with specified parameters.
Upon success the callback function is invoked with the created queue details.

#### Parameters

##### queue

The name or parameters for the queue.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### queueType

[`EQueueType`](../enumerations/EQueueType.md)

The type of the queue, defined by EQueueType.

##### deliveryModel

[`EQueueDeliveryModel`](../enumerations/EQueueDeliveryModel.md)

The model for message delivery, defined by EQueueDeliveryModel.

##### cb

`ICallback`\<\{ `properties`: [`IQueueProperties`](../interfaces/IQueueProperties.md); `queue`: [`IQueueParams`](../interfaces/IQueueParams.md); \}\>

Callback function to handle success or error.

#### Returns

`void`

#### See

- /packages/redis-smq/docs/api/enumerations/EQueueType.md
- /packages/redis-smq/docs/api/enumerations/EQueueDeliveryModel.md

#### Throws

InvalidQueueParametersError

#### Throws

QueueAlreadyExistsError

#### Throws

UnexpectedScriptReplyError
