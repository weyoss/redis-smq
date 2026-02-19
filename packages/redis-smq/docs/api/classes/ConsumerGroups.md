[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerGroups

# Class: ConsumerGroups

The `ConsumerGroups` class is responsible for managing consumer groups within RedisSMQ.
It provides functionality to save, delete, and retrieve consumer groups associated with specific queues.
The class uses Redis as a backend and employs an event bus for managing events related to consumer groups.

## Constructors

### Constructor

> **new ConsumerGroups**(): `ConsumerGroups`

#### Returns

`ConsumerGroups`

## Methods

### deleteConsumerGroup()

> **deleteConsumerGroup**(`queue`, `groupId`, `cb`): `void`

Delete Consumer Group

Deletes a consumer group from a specific queue.

#### Parameters

##### queue

The queue from which to delete the consumer group.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### groupId

`string`

The ID of the consumer group to delete.

##### cb

`ICallback`\<`void`\>

Callback function to handle the result or error.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

QueueNotFoundError

#### Throws

ConsumerGroupNotEmptyError

#### Throws

ConsumerGroupsNotSupportedError

#### Throws

QueueOperationForbiddenError

#### Throws

UnexpectedScriptReplyError

---

### getConsumerGroups()

> **getConsumerGroups**(`queue`, `cb`): `void`

Get Consumer Groups

Retrieves a list of consumer group IDs associated with a specific queue.

#### Parameters

##### queue

The queue from which to retrieve consumer groups.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### cb

`ICallback`\<`string`[]\>

Callback function to handle the result or error.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

---

### saveConsumerGroup()

> **saveConsumerGroup**(`queue`, `groupId`, `cb`): `void`

Save Consumer Group

Saves a consumer group to a specific queue.

#### Parameters

##### queue

The queue to which the consumer group belongs.

`string` | [`IQueueParams`](../interfaces/IQueueParams.md)

##### groupId

`string`

The ID of the consumer group to save.

##### cb

`ICallback`\<`number`\>

Callback function to handle the result or error.

#### Returns

`void`

#### Throws

InvalidQueueParametersError

#### Throws

QueueNotFoundError

#### Throws

InvalidConsumerGroupIdError

#### Throws

ConsumerGroupsNotSupportedError
