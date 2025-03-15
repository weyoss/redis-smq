[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / Namespace

# Class: Namespace

Namespace class for managing message queue namespaces in Redis.
This class provides methods to get, create, and delete namespaces, as well as retrieve
associated queues.

## Table of contents

### Constructors

- [constructor](Namespace.md#constructor)

### Methods

- [delete](Namespace.md#delete)
- [getNamespaceQueues](Namespace.md#getnamespacequeues)
- [getNamespaces](Namespace.md#getnamespaces)
- [shutdown](Namespace.md#shutdown)

## Constructors

### constructor

• **new Namespace**(): [`Namespace`](Namespace.md)

#### Returns

[`Namespace`](Namespace.md)

## Methods

### delete

▸ **delete**(`namespace`, `cb`): `void`

Deletes a namespace and its associated queues from Redis.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `namespace` | `string` | The namespace to delete. |
| `cb` | `ICallback`\<`void`\> | Callback function to handle the result. |

#### Returns

`void`

___

### getNamespaceQueues

▸ **getNamespaceQueues**(`namespace`, `cb`): `void`

Retrieves all queues associated with a given namespace.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `namespace` | `string` | The namespace to retrieve queues for. |
| `cb` | `ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\> | Callback function to handle the result. |

#### Returns

`void`

___

### getNamespaces

▸ **getNamespaces**(`cb`): `void`

Retrieves all namespaces from Redis.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | `ICallback`\<`string`[]\> | Callback function to handle the result. |

#### Returns

`void`

___

### shutdown

▸ **shutdown**(`cb`): `void`

Shuts down the Redis client.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cb` | `ICallback`\<`void`\> | Callback function to handle the shutdown result. |

#### Returns

`void`
