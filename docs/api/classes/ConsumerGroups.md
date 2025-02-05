[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / ConsumerGroups

# Class: ConsumerGroups

The `ConsumerGroups` class is responsible for managing consumer groups within RedisSMQ.
It provides functionality to save, delete, and retrieve consumer groups associated with specific queues.
The class uses Redis as a backend and employs an event bus for managing events related to consumer groups.

## Table of contents

### Constructors

- [constructor](ConsumerGroups.md#constructor)

### Methods

- [deleteConsumerGroup](ConsumerGroups.md#deleteconsumergroup)
- [getConsumerGroups](ConsumerGroups.md#getconsumergroups)
- [saveConsumerGroup](ConsumerGroups.md#saveconsumergroup)
- [shutdown](ConsumerGroups.md#shutdown)

## Constructors

### constructor

• **new ConsumerGroups**(): [`ConsumerGroups`](ConsumerGroups.md)

#### Returns

[`ConsumerGroups`](ConsumerGroups.md)

## Methods

### deleteConsumerGroup

▸ **deleteConsumerGroup**(`queue`, `groupId`, `cb`): `void`

Delete Consumer Group

Deletes a consumer group from a specific queue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | The queue from which to delete the consumer group. |
| `groupId` | `string` | The ID of the consumer group to delete. |
| `cb` | `ICallback`\<`void`\> | Callback function to handle the result or error. |

#### Returns

`void`

___

### getConsumerGroups

▸ **getConsumerGroups**(`queue`, `cb`): `void`

Get Consumer Groups

Retrieves a list of consumer group IDs associated with a specific queue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | The queue from which to retrieve consumer groups. |
| `cb` | `ICallback`\<`string`[]\> | Callback function to handle the result or error. |

#### Returns

`void`

___

### saveConsumerGroup

▸ **saveConsumerGroup**(`queue`, `groupId`, `cb`): `void`

Save Consumer Group

Saves a consumer group to a specific queue.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `queue` | `string` \| [`IQueueParams`](../interfaces/IQueueParams.md) | The queue to which the consumer group belongs. |
| `groupId` | `string` | The ID of the consumer group to save. |
| `cb` | `ICallback`\<`number`\> | Callback function to handle the result or error. |

#### Returns

`void`

___

### shutdown

▸ **shutdown**(`cb`): `void`

Shutdown

Shuts down the consumer groups manager and cleans up resources.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | `ICallback`\<`void`\> | Callback function to handle the result of the shutdown operation. |

#### Returns

`void`
