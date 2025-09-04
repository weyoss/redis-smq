[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Queue

# Class: Queue

The Queue class represents an interface that interacts with Redis for storing
and managing queues.
It provides functionality to create, check existence, delete, retrieve
properties of queues, and manage shutdown operations.

## Constructors

### Constructor

> **new Queue**(): `Queue`

#### Returns

`Queue`

## Methods

### delete()

> **delete**(`queue`, `cb`): `void`

Deletes a specific queue.

#### Parameters

##### queue

The name or parameters for the queue to be deleted.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`void`\>

Callback function to handle success or error.

#### Returns

`void`

***

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

***

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

***

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

***

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

***

### getQueues()

> **getQueues**(`cb`): `void`

Fetches all existing queues.

#### Parameters

##### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Callback function to return with a list of queues or an error.

#### Returns

`void`

***

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

 - https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/enums/EQueueType.md
 - https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/enums/EQueueDeliveryModel.md

***

### shutdown()

> **shutdown**(`cb`): `void`

Cleans up resources by shutting down the Redis client and event bus.

#### Parameters

##### cb

`ICallback`\<`void`\>

Callback function to handle completion of the shutdown process.

#### Returns

`void`
