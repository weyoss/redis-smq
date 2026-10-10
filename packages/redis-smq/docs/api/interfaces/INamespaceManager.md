[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / INamespaceManager

# Interface: INamespaceManager

Manages message queue namespaces.

A namespace is a logical partition that isolates queues and exchanges
from those in other namespaces. Every queue belongs to exactly one
namespace; the namespace is part of the queue's identity, and two
queues with the same name in different namespaces are distinct.

Namespaces are created implicitly — creating the first queue in a
namespace brings the namespace into existence. There is no explicit
"create namespace" operation. Deleting a namespace is explicit and
removes every queue it contains.

The namespace name is validated before any operation: it must satisfy
the library's Redis-key rules (start with a letter; letters, digits,
`-`, `_`, and `.` thereafter). An invalid name fails with
`InvalidNamespaceError`.

Both the promise and callback forms are declared for every
asynchronous method, matching the concrete class.

## Example

```ts
const namespaces = new NamespaceManager();

// Enumerate all namespaces
const all = await namespaces.getNamespaces();

// Enumerate the queues in one namespace
const queues = await namespaces.getNamespaceQueues('production');

// Delete a namespace and every queue it contains
await namespaces.delete('staging');
```

## Methods

### delete()

#### Call Signature

> **delete**(`namespace`): `Promise`\<`void`\>

Deletes a namespace and every queue it contains.

The operation is not atomic across the whole namespace. It performs
the following sequence:

1. Verifies the namespace exists.
2. Reads the list of queues in the namespace.
3. Deletes each queue in turn, using the same deletion path as
   `IQueueManager.delete()`. A queue that has pending messages,
   active consumers, or bound exchanges causes its own deletion
   to fail with the corresponding error.
4. Removes the namespace from the global namespace registry.

If any queue fails to delete, the whole operation fails with the
first error encountered. Queues deleted before the failure remain
deleted — the namespace is left in a partially deleted state, and
the caller should inspect the error and retry after fixing the
cause.

One exception: if the queue has already disappeared by the time the
deletion reaches it (a `QueueNotFoundError`), the deletion is
treated as a success. This makes the operation tolerant of a
concurrent deletion of the same queue by another caller.

Fails with `InvalidNamespaceError` if the namespace name is
invalid. Fails with `NamespaceNotFoundError` if the namespace does
not exist.

##### Parameters

###### namespace

`string`

##### Returns

`Promise`\<`void`\>

##### Example

```ts
// Promise
await namespaceManager.delete('staging');

// Callback
namespaceManager.delete('staging', (err) => {
  if (err) throw err;
});
```

#### Call Signature

> **delete**(`namespace`, `cb`): `void`

##### Parameters

###### namespace

`string`

###### cb

`ICallback`\<`void`\>

##### Returns

`void`

---

### getNamespaceQueues()

#### Call Signature

> **getNamespaceQueues**(`namespace`): `Promise`\<[`IQueueParams`](IQueueParams.md)[]\>

Returns every queue in a namespace.

The result is a list of `{ name, ns }` objects, where `ns` is the
namespace that was queried. The list is derived from the namespace's
queue index — the same Redis set that `getQueues()` on
`IQueueManager` iterates for a single namespace.

Fails with `InvalidNamespaceError` if the namespace name does not
satisfy the key-validity rules.

Fails with `NamespaceNotFoundError` if the namespace exists as a
valid identifier but no queue has ever been created in it, or if
every queue it contained has been deleted.

Returns an empty array if the namespace exists but contains no
queues — a state that can occur transiently during namespace
deletion. In practice a caller rarely observes it: the namespace
registry and its queue index are updated atomically, so either both
are present or neither is.

##### Parameters

###### namespace

`string`

##### Returns

`Promise`\<[`IQueueParams`](IQueueParams.md)[]\>

##### Example

```ts
// Promise
const queues = await namespaceManager.getNamespaceQueues('production');
queues.forEach((q) => console.log(q.name));

// Callback
namespaceManager.getNamespaceQueues('production', (err, queues) => {
  if (err) throw err;
  console.log(queues);
});
```

#### Call Signature

> **getNamespaceQueues**(`namespace`, `cb`): `void`

##### Parameters

###### namespace

`string`

###### cb

`ICallback`\<[`IQueueParams`](IQueueParams.md)[]\>

##### Returns

`void`

---

### getNamespaces()

#### Call Signature

> **getNamespaces**(): `Promise`\<`string`[]\>

Returns every namespace in use.

A namespace is "in use" if at least one queue was created in it and
has not since been deleted. The namespace registry is a Redis set;
a namespace is added to it on first queue creation and removed from
it when the last queue in the namespace is deleted.

Order is undefined. A caller that needs a stable order sorts the
result.

Returns an empty array when no namespaces exist yet — a freshly
initialized RedisSMQ instance with no queues. This is not an error;
the source raises `CallbackEmptyReplyError` in one internal branch,
but the observable behavior for a caller is that the method either
resolves with `[]` or rejects with `CallbackEmptyReplyError`, and
the concrete implementation currently rejects. Callers who want
uniform behavior should treat `CallbackEmptyReplyError` as an empty
list.

##### Returns

`Promise`\<`string`[]\>

##### Example

```ts
// Promise
const namespaces = await namespaceManager.getNamespaces();
console.log(namespaces);

// Callback
namespaceManager.getNamespaces((err, namespaces) => {
  if (err) throw err;
  console.log(namespaces);
});
```

#### Call Signature

> **getNamespaces**(`cb`): `void`

##### Parameters

###### cb

`ICallback`\<`string`[]\>

##### Returns

`void`
