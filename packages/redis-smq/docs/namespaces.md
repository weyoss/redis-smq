[RedisSMQ](../README.md) / [Documentation](README.md) / Namespaces

# Namespaces

Namespaces isolate queues and exchanges. Use them to separate environments or applications within the same Redis instance.

## Quick Start

```javascript
const { RedisSMQ } = require('redis-smq');
const namespaceManager = RedisSMQ.createNamespaceManager();
```

## Default Namespace

The default namespace comes from [configuration](configuration.md). When you use a simple queue name, the default namespace is applied:

```javascript
// Uses default namespace (e.g., 'production')
await queueManager.save(
  'orders',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
);
```

## Explicit Namespace

Specify a namespace per operation:

```javascript
// Uses 'staging' namespace regardless of default
await queueManager.save(
  { ns: 'staging', name: 'orders' },
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
);
```

## Listing Namespaces

A namespace exists in the registry once at least one queue has been created in it. It is removed when the last queue in it is deleted.

```javascript
const namespaces = await namespaceManager.getNamespaces();
console.log('Namespaces:', namespaces);
// ['production', 'staging', 'analytics']
```

A freshly initialized RedisSMQ instance with no queues yet returns an empty array.

## Listing Queues in a Namespace

```javascript
const queues = await namespaceManager.getNamespaceQueues('production');
queues.forEach((q) => {
  console.log(`${q.name}@${q.ns}`);
});
```

Fails with `NamespaceNotFoundError` if no queue has ever been created in that namespace (or every queue in it has been deleted). Fails with `InvalidNamespaceError` if the name does not satisfy the validity rules below.

## Deleting a Namespace

Deleting a namespace removes every **queue** in it, every **exchange** in it, and every **binding** between them:

```javascript
await namespaceManager.delete('staging');
console.log('Namespace deleted');
```

The deletion runs in six steps:

1. Verify the namespace exists.
2. Enumerate the namespace's queues and exchanges.
3. Unbind every queue from every exchange in the namespace.
4. Delete each queue.
5. Delete each exchange.
6. Remove the namespace from the global registry.

Steps 3 and 5 are necessary because a queue cannot be deleted while it has bound exchanges, and an exchange cannot be deleted while it has bound queues. The unbind step clears both conditions before either delete runs.

### Queue-level preconditions still apply

Each queue is deleted via the same path as `QueueManager.delete()`, so a queue that still has **message records** — a message hash, or a history list if unacknowledgement-history audit is enabled — causes its own deletion to fail with `QueueNotEmptyError`, and the whole namespace deletion aborts. Queues deleted before the failure remain deleted.

To delete a namespace whose queues have accepted messages, purge the relevant message records first, exactly as you would for a single queue. See [Queue Management](queue-management.md) for the workflow.

Similarly, a queue with active consumers fails with `QueueHasActiveConsumersError`, and a LOCKED queue fails with `QueueLockedError`. Both abort the whole operation.

### Not atomic across the namespace

If any step fails partway through — a Redis error, a queue that refuses deletion — the namespace is left partially deleted. Queues, exchanges, and bindings removed before the failure remain removed. Inspect the error, fix the cause, and retry: the operation re-enters from the top and skips resources that are already gone.

### Concurrent deletion is tolerated

If a queue, an exchange, or a binding has already disappeared by the time the operation reaches it — removed by another caller running `delete()` on the same namespace — the absence is treated as success for that resource.

### What gets deleted

- Every queue in the namespace and its queue-level state (properties, message-ID lists, per-consumer processing queues, per-consumer-group structures, exchange bindings, consumer registrations, state history).
- Every exchange in the namespace and its binding structures.
- Every binding between them.

Message records (the message hashes and unacknowledgement-history lists) are **not** deleted by this operation. By the time the queue deletions are permitted to proceed, none remain — the same precondition that `QueueManager.delete()` enforces.

Heartbeat keys for consumers of the namespace's queues are left to expire on their own TTL.

## Multiple Namespaces

RedisSMQ supports any number of namespaces simultaneously. The configured default is only a fallback — it does not restrict using other namespaces:

```javascript
// All in the same Redis instance
await queueManager.save(
  'orders',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
);
await queueManager.save(
  { ns: 'analytics', name: 'orders' },
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
);
await queueManager.save(
  { ns: 'staging', name: 'orders' },
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
);
```

Three distinct queues: `orders@<default-ns>`, `orders@analytics`, `orders@staging`.

Exchanges are scoped the same way. A binding between a queue and an exchange requires that both are in the same namespace — a cross-namespace bind rejects with `NamespaceMismatchError`.

## Valid Names

A namespace name is normalized and validated the same way every other Redis-key-shaped identifier in the library is:

- It is lowercased before validation.
- It must begin with a letter.
- It may contain letters, digits, hyphens, underscores, and dots thereafter.

| Input         | Result                                  |
| ------------- | --------------------------------------- |
| `production`  | ✅ stored as `production`               |
| `Production`  | ✅ normalized to `production`           |
| `my-app`      | ✅ stored as `my-app`                   |
| `app.staging` | ✅ stored as `app.staging`              |
| `my app`      | ❌ rejected (space)                     |
| `3app`        | ❌ rejected (starts with a digit)       |
| `_app`        | ❌ rejected (starts with an underscore) |

Because normalization happens before validation, `Production` and `production` refer to the **same** namespace. If you need case-distinct namespaces, use suffixes or prefixes that survive lowercasing (`app-prod`, `app-staging`).

## Promise Style

Every method supports both callback and promise forms.

```javascript
const namespaces = await namespaceManager.getNamespaces();
const queues = await namespaceManager.getNamespaceQueues('production');
await namespaceManager.delete('staging');
```

## Related

- [Configuration](configuration.md) — Setting the default namespace
- [Queue Management](queue-management.md) — Creating queues with namespaces, message-record cleanup before deletion
- [Exchanges and Delivery Models](exchanges-and-delivery-models.md) — Exchange lifecycle
