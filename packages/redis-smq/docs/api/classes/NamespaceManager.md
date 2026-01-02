[RedisSMQ](../../../README.md) / [Docs](../../README.md) / [API Reference](../README.md) / NamespaceManager

# Class: NamespaceManager

NamespaceManager class for managing message queue namespaces in Redis.
This class provides methods to get, create, and delete namespaces, as well as retrieve
associated queues.

## Constructors

### Constructor

> **new NamespaceManager**(): `NamespaceManager`

#### Returns

`NamespaceManager`

## Methods

### delete()

> **delete**(`namespace`, `cb`): `void`

Deletes a namespace and its associated queues from Redis.

#### Parameters

##### namespace

`string`

The namespace to delete.

##### cb

`ICallback`\<`void`\>

Callback function to handle the result.

#### Returns

`void`

#### Throws

InvalidNamespaceError

#### Throws

NamespaceNotFoundError

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

### getNamespaceQueues()

> **getNamespaceQueues**(`namespace`, `cb`): `void`

Retrieves all queues associated with a given namespace.

#### Parameters

##### namespace

`string`

The namespace to retrieve queues for.

##### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Callback function to handle the result.

#### Returns

`void`

#### Throws

InvalidNamespaceError

#### Throws

NamespaceNotFoundError

---

### getNamespaces()

> **getNamespaces**(`cb`): `void`

Retrieves all namespaces from Redis.

#### Parameters

##### cb

`ICallback`\<`string`[]\>

Callback function to handle the result.

#### Returns

`void`
