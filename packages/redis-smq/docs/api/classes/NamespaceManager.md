[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / NamespaceManager

# Class: NamespaceManager

NamespaceManager class for managing message queue namespaces in Redis.
This class provides methods to get, create, and delete namespaces, as well as retrieve
associated queues.

Namespaces provide logical isolation for queues, allowing you to group related queues
and avoid naming conflicts. Each queue belongs to a namespace, with the default
namespace being "default" if not specified.

## Example

```typescript
const namespaceManager = new NamespaceManager();

// Using callback
namespaceManager.getNamespaces((err, namespaces) => {
  if (err) {
    console.error('Failed to get namespaces:', err);
  } else {
    console.log('Namespaces:', namespaces);
  }
});

// Using promise
const namespaces = await namespaceManager.getNamespaces();
console.log('Namespaces:', namespaces);
```

## Constructors

### Constructor

> **new NamespaceManager**(): `NamespaceManager`

#### Returns

`NamespaceManager`

## Methods

### delete()

#### Call Signature

> **delete**(`namespace`): `Promise`\<`void`\>

Deletes a namespace and its associated queues from Redis.

This method performs a complete deletion of a namespace and all queues within it.
The operation is comprehensive and includes validation checks to ensure the
namespace can be safely deleted.

##### Parameters

###### namespace

`string`

The namespace to delete (must be a valid Redis key)

##### Returns

`Promise`\<`void`\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the namespace parameter is invalid.

##### Throws

When the specified namespace doesn't exist.

##### Throws

When a queue in the namespace doesn't exist (should not happen).

##### Throws

When a queue in the namespace has messages.

##### Throws

When a queue has active consumers.

##### Throws

When a queue has bound exchanges.

##### Throws

When consumer set is inconsistent.

##### Throws

When Redis returns an unexpected response.

##### Throws

When a queue is locked.

##### Throws

When a queue is in an invalid state.

##### Example

```typescript
const namespaceManager = new NamespaceManager();

// Callback pattern
namespaceManager.delete('staging', (err) => {
  if (err) {
    console.error('Failed to delete namespace:', err);
  } else {
    console.log('Namespace and all its queues deleted successfully');
  }
});

// Promise pattern
async function safeDeleteNamespace(namespace: string) {
  try {
    // First, check if namespace exists
    const namespaces = await namespaceManager.getNamespaces();
    if (!namespaces.includes(namespace)) {
      console.log(`Namespace '${namespace}' does not exist`);
      return false;
    }

    // Delete the namespace
    await namespaceManager.delete(namespace);
    console.log(`Namespace '${namespace}' deleted successfully`);
    return true;
  } catch (err) {
    console.error('Failed to delete namespace:', err);
    return false;
  }
}
```

#### Call Signature

> **delete**(`namespace`, `cb`): `void`

Deletes a namespace and its associated queues from Redis.

This method performs a complete deletion of a namespace and all queues within it.
The operation is comprehensive and includes validation checks to ensure the
namespace can be safely deleted.

##### Parameters

###### namespace

`string`

The namespace to delete (must be a valid Redis key)

###### cb

`ICallback`\<`void`\>

Optional callback function to handle the result. - On success: `cb(null)` - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves when deleted.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the namespace parameter is invalid.

##### Throws

When the specified namespace doesn't exist.

##### Throws

When a queue in the namespace doesn't exist (should not happen).

##### Throws

When a queue in the namespace has messages.

##### Throws

When a queue has active consumers.

##### Throws

When a queue has bound exchanges.

##### Throws

When consumer set is inconsistent.

##### Throws

When Redis returns an unexpected response.

##### Throws

When a queue is locked.

##### Throws

When a queue is in an invalid state.

##### Example

```typescript
const namespaceManager = new NamespaceManager();

// Callback pattern
namespaceManager.delete('staging', (err) => {
  if (err) {
    console.error('Failed to delete namespace:', err);
  } else {
    console.log('Namespace and all its queues deleted successfully');
  }
});

// Promise pattern
async function safeDeleteNamespace(namespace: string) {
  try {
    // First, check if namespace exists
    const namespaces = await namespaceManager.getNamespaces();
    if (!namespaces.includes(namespace)) {
      console.log(`Namespace '${namespace}' does not exist`);
      return false;
    }

    // Delete the namespace
    await namespaceManager.delete(namespace);
    console.log(`Namespace '${namespace}' deleted successfully`);
    return true;
  } catch (err) {
    console.error('Failed to delete namespace:', err);
    return false;
  }
}
```

---

### getNamespaceQueues()

#### Call Signature

> **getNamespaceQueues**(`namespace`): `Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Retrieves all queues associated with a given namespace.

This method returns detailed queue information for all queues within a specific
namespace. Each queue is represented with its name and namespace, allowing you
to inspect and manage queues in a particular namespace.

##### Parameters

###### namespace

`string`

The namespace to retrieve queues for (must be a valid Redis key)

##### Returns

`Promise`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the namespace parameter is invalid (empty or contains invalid characters).

##### Throws

When the specified namespace doesn't exist.

##### Example

```typescript
const namespaceManager = new NamespaceManager();

// Callback pattern
namespaceManager.getNamespaceQueues('production', (err, queues) => {
  if (err) {
    if (err instanceof NamespaceNotFoundError) {
      console.error('Namespace does not exist');
    } else {
      console.error('Failed to get queues:', err);
    }
  } else {
    console.log(`Found ${queues.length} queues in production namespace:`);
    queues.forEach((queue) => {
      console.log(`  - ${queue.name}@${queue.ns}`);
    });
  }
});

// Promise pattern
async function getNamespaceMetrics(namespace: string) {
  try {
    const queues = await namespaceManager.getNamespaceQueues(namespace);
    const queueManager = new QueueManager();

    let totalMessages = 0;
    let totalPending = 0;

    for (const queue of queues) {
      const props = await queueManager.getProperties(queue);
      totalMessages += props.messagesCount;
      totalPending += props.pendingMessagesCount;
    }

    console.log(`Namespace '${namespace}' metrics:`);
    console.log(`  Total queues: ${queues.length}`);
    console.log(`  Total messages: ${totalMessages}`);
    console.log(`  Total pending: ${totalPending}`);

    return { queues, totalMessages, totalPending };
  } catch (err) {
    console.error('Failed to get namespace metrics:', err);
  }
}
```

#### Call Signature

> **getNamespaceQueues**(`namespace`, `cb`): `void`

Retrieves all queues associated with a given namespace.

This method returns detailed queue information for all queues within a specific
namespace. Each queue is represented with its name and namespace, allowing you
to inspect and manage queues in a particular namespace.

##### Parameters

###### namespace

`string`

The namespace to retrieve queues for (must be a valid Redis key)

###### cb

`ICallback`\<[`IQueueParams`](../interfaces/IQueueParams.md)[]\>

Optional callback function to handle the result. - On success: `cb(null, queues)` where queues is an array of queue parameters. - On error: `cb(error)` with one of the errors listed below. - If not provided, the method returns a Promise that resolves with the queues.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Throws

When the namespace parameter is invalid (empty or contains invalid characters).

##### Throws

When the specified namespace doesn't exist.

##### Example

```typescript
const namespaceManager = new NamespaceManager();

// Callback pattern
namespaceManager.getNamespaceQueues('production', (err, queues) => {
  if (err) {
    if (err instanceof NamespaceNotFoundError) {
      console.error('Namespace does not exist');
    } else {
      console.error('Failed to get queues:', err);
    }
  } else {
    console.log(`Found ${queues.length} queues in production namespace:`);
    queues.forEach((queue) => {
      console.log(`  - ${queue.name}@${queue.ns}`);
    });
  }
});

// Promise pattern
async function getNamespaceMetrics(namespace: string) {
  try {
    const queues = await namespaceManager.getNamespaceQueues(namespace);
    const queueManager = new QueueManager();

    let totalMessages = 0;
    let totalPending = 0;

    for (const queue of queues) {
      const props = await queueManager.getProperties(queue);
      totalMessages += props.messagesCount;
      totalPending += props.pendingMessagesCount;
    }

    console.log(`Namespace '${namespace}' metrics:`);
    console.log(`  Total queues: ${queues.length}`);
    console.log(`  Total messages: ${totalMessages}`);
    console.log(`  Total pending: ${totalPending}`);

    return { queues, totalMessages, totalPending };
  } catch (err) {
    console.error('Failed to get namespace metrics:', err);
  }
}
```

---

### getNamespaces()

#### Call Signature

> **getNamespaces**(): `Promise`\<`string`[]\>

Retrieves all namespaces from Redis.

This method returns a list of all namespaces that have been created in the system.
Namespaces are stored as a Redis set, making this operation efficient even with
a large number of namespaces.

##### Returns

`Promise`\<`string`[]\>

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Example

```typescript
const namespaceManager = new NamespaceManager();

// Callback pattern
namespaceManager.getNamespaces((err, namespaces) => {
  if (err) {
    console.error('Failed to get namespaces:', err);
  } else {
    console.log(`Found ${namespaces.length} namespaces:`);
    namespaces.forEach((ns) => console.log(`  - ${ns}`));
  }
});

// Promise pattern - list namespaces with queue counts
async function listNamespacesWithQueueCounts() {
  try {
    const namespaces = await namespaceManager.getNamespaces();
    console.log(`Total namespaces: ${namespaces.length}`);

    for (const ns of namespaces) {
      const queues = await namespaceManager.getNamespaceQueues(ns);
      console.log(`Namespace '${ns}': ${queues.length} queues`);
    }
  } catch (err) {
    console.error('Failed to list namespaces:', err);
  }
}
```

#### Call Signature

> **getNamespaces**(`cb`): `void`

Retrieves all namespaces from Redis.

This method returns a list of all namespaces that have been created in the system.
Namespaces are stored as a Redis set, making this operation efficient even with
a large number of namespaces.

##### Parameters

###### cb

`ICallback`\<`string`[]\>

Optional callback function to handle the result. - On success: `cb(null, namespaces)` where namespaces is an array of namespace strings. - On error: `cb(error)` with any Redis or system errors. - If not provided, the method returns a Promise that resolves with the namespaces.

##### Returns

`void`

- Returns a Promise if no callback is provided,
  otherwise returns void.

##### Example

```typescript
const namespaceManager = new NamespaceManager();

// Callback pattern
namespaceManager.getNamespaces((err, namespaces) => {
  if (err) {
    console.error('Failed to get namespaces:', err);
  } else {
    console.log(`Found ${namespaces.length} namespaces:`);
    namespaces.forEach((ns) => console.log(`  - ${ns}`));
  }
});

// Promise pattern - list namespaces with queue counts
async function listNamespacesWithQueueCounts() {
  try {
    const namespaces = await namespaceManager.getNamespaces();
    console.log(`Total namespaces: ${namespaces.length}`);

    for (const ns of namespaces) {
      const queues = await namespaceManager.getNamespaceQueues(ns);
      console.log(`Namespace '${ns}': ${queues.length} queues`);
    }
  } catch (err) {
    console.error('Failed to list namespaces:', err);
  }
}
```
