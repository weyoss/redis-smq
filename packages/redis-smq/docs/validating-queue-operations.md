[RedisSMQ](../README.md) / [Documentation](README.md) / Validating Queue Operations

# Validating Queue Operations

The queue operation validator checks whether an operation is allowed on a queue, based on the queue's current operational state. Use it to avoid errors before attempting operations that may be rejected.

The validator is available through the `RedisSMQ` factory:

```javascript
const { RedisSMQ } = require('redis-smq');
const validator = RedisSMQ.createQueueOperationValidator();
```

All methods on the validator are **static**. `createQueueOperationValidator()` returns the class itself (it is a static-only class), and calling it before `RedisSMQ.initialize()` completes throws `PanicError`.

## Queue States and Allowed Operations

The validator consults a fixed registry of state-to-operation mappings. Every operation on the validator is answered by looking up the queue's current state in this registry.

| State       | Description        | Allowed operations                                         |
| ----------- | ------------------ | ---------------------------------------------------------- |
| **ACTIVE**  | Fully operational  | All operations                                             |
| **PAUSED**  | Temporarily paused | All except `CONSUME`                                       |
| **STOPPED** | Stopped            | Management only — `PRODUCE` and `CONSUME` are both refused |
| **LOCKED**  | Locked             | None                                                       |

"Management" for a STOPPED queue means `PURGE`, `DELETE`, `DELETE_MESSAGE`, `REQUEUE_MESSAGE`, `SET_RATE_LIMIT`, `CLEAR_RATE_LIMIT`, `CREATE_CONSUMER_GROUP`, `DELETE_CONSUMER_GROUP`, `BIND_EXCHANGE`, and `UNBIND_EXCHANGE`.

See [Queue State Management](queue-state-management.md) for how a queue reaches each state, and [Queue Management](queue-management.md) for the operations themselves.

## Method Reference

Every validator method corresponds to one operation. Each returns a `Promise<boolean>` in the promise form, or accepts an `(err, allowed)` callback in the callback form.

| Method                      | Operation               | What it checks                                                   |
| --------------------------- | ----------------------- | ---------------------------------------------------------------- |
| `canConsume(queue)`         | `CONSUME`               | Whether messages can be dequeued from the queue                  |
| `canProduce(queue)`         | `PRODUCE`               | Whether a message can be published to the queue                  |
| `canDelete(queue)`          | `DELETE`                | Whether the queue itself can be deleted                          |
| `canDeleteMessage(queue)`   | `DELETE_MESSAGE`        | Whether a specific message can be deleted by ID                  |
| `canPurge(queue)`           | `PURGE`                 | Whether the queue's messages can be purged in bulk               |
| `canRequeue(queue)`         | `REQUEUE_MESSAGE`       | Whether an acknowledged or dead-lettered message can be requeued |
| `canSetRateLimit(queue)`    | `SET_RATE_LIMIT`        | Whether a rate limit can be set on the queue                     |
| `canClearRateLimit(queue)`  | `CLEAR_RATE_LIMIT`      | Whether the queue's rate limit can be removed                    |
| `canCreateConsumerGroup(q)` | `CREATE_CONSUMER_GROUP` | Whether a consumer group can be created (Pub/Sub only)           |
| `canDeleteConsumerGroup(q)` | `DELETE_CONSUMER_GROUP` | Whether a consumer group can be deleted (Pub/Sub only)           |
| `canBindExchange(queue)`    | `BIND_EXCHANGE`         | Whether an exchange can be bound to the queue                    |
| `canUnbindExchange(queue)`  | `UNBIND_EXCHANGE`       | Whether an exchange can be unbound from the queue                |

The methods check **only** the queue's operational state. They do not check the operation-specific preconditions that the operation itself enforces. For example:

- `canDelete(queue)` returns `true` for a queue in `ACTIVE`, `PAUSED`, or `STOPPED` state, regardless of whether the queue has pending messages, active consumers, or bound exchanges. The actual `QueueManager.delete()` call will still reject with `QueueNotEmptyError`, `QueueHasActiveConsumersError`, or `QueueHasBoundExchangesError` if any of those conditions hold. To avoid the round-trip, check both the state **and** the runtime preconditions.
- `canDeleteMessage(queue)` returns `true` for a queue in a deletable state, but a message in the `PROCESSING` state cannot be deleted regardless of the queue's state — that check lives inside `MessageManager.deleteMessageById()`.

In other words: the validator answers "does the queue's state permit this operation?" — not "will this operation succeed?".

## Usage

### Consumption and Production

```javascript
const validator = RedisSMQ.createQueueOperationValidator();

const canConsume = await validator.canConsume('orders');
if (canConsume) {
  await consumer.consume('orders', handler);
} else {
  console.log('Queue is not currently consuming');
}

const canProduce = await validator.canProduce('notifications');
if (canProduce) {
  await producer.produce(msg);
} else {
  console.log('Queue is not accepting messages');
}
```

### Queue Management

```javascript
const queueManager = RedisSMQ.createQueueManager();
const messageManager = RedisSMQ.createMessageManager();
const published = RedisSMQ.createQueuePublishedMessages();

// Delete the queue itself
if (await validator.canDelete('temp-queue')) {
  await queueManager.delete('temp-queue');
}

// Purge messages (bulk delete via the browser, not the queue manager)
if (await validator.canPurge('test-queue')) {
  const jobId = await published.purge('test-queue');
  // ... wait for the purge job ...
}

// Requeue an acknowledged or dead-lettered message
if (await validator.canRequeue('orders')) {
  await messageManager.requeueMessageById(messageId);
}

// Delete a message by ID
if (await validator.canDeleteMessage('orders')) {
  await messageManager.deleteMessageById(messageId);
}
```

### Rate Limits

```javascript
const rateLimitManager = RedisSMQ.createQueueRateLimitManager();

if (await validator.canSetRateLimit('orders')) {
  await rateLimitManager.set('orders', { limit: 100, interval: 60000 });
}

if (await validator.canClearRateLimit('orders')) {
  await rateLimitManager.clear('orders');
}
```

### Consumer Groups

```javascript
const consumerGroups = RedisSMQ.createConsumerGroupsManager();

if (await validator.canCreateConsumerGroup('notifications')) {
  await consumerGroups.saveConsumerGroup('notifications', 'email-service');
}

if (await validator.canDeleteConsumerGroup('notifications')) {
  await consumerGroups.deleteConsumerGroup('notifications', 'email-service');
}
```

### Exchange Bindings

```javascript
const directExchange = RedisSMQ.createDirectExchange();

if (await validator.canBindExchange('orders')) {
  await directExchange.bindQueue('orders', 'app', 'order.created');
}

if (await validator.canUnbindExchange('orders')) {
  await directExchange.unbindQueue('orders', 'app', 'order.created');
}
```

### With Namespaces

Every method accepts either a bare queue name (resolved against the default namespace) or a `{ name, ns }` object:

```javascript
// Default namespace
await validator.canConsume('orders');

// Explicit namespace
await validator.canConsume({ ns: 'production', name: 'orders' });
```

## Callback Form

Every method supports both forms. The callback form passes an `(err, allowed)` callback as the last argument:

```javascript
validator.canConsume('orders', (err, canConsume) => {
  if (err) return console.error(err);
  if (canConsume) startConsumer();
  else console.log('Queue is not available for consumption');
});
```

## Error Handling

A `canX` call rejects with `QueueNotFoundError` if the queue does not exist. It does **not** resolve with `false` for a missing queue — the boolean answers "is the operation allowed by the current state", and a missing queue has no state.

```javascript
try {
  const allowed = await validator.canConsume('orders');
  console.log('Allowed:', allowed);
} catch (err) {
  if (err instanceof errors.QueueNotFoundError) {
    console.log('Queue does not exist');
  } else {
    console.error(err);
  }
}
```

An invalid queue name or namespace rejects with `InvalidQueueParametersError` before any Redis call. An invalid namespace rejects with `InvalidNamespaceError`.

## Race Awareness

A queue's state can change between the validator call and the operation call. The validator is not a lock — it is a read-only observation of the queue's state at the moment of the call. Two patterns are common:

```javascript
// Best-effort — act, and handle a rejection if the state changed
if (await validator.canConsume('orders')) {
  try {
    await consumer.consume('orders', handler);
  } catch (err) {
    // The queue was paused or stopped between the check and the call.
  }
}

// Or subscribe to state changes and react to them
const eventBus = RedisSMQ.getEventBus();
await eventBus.run();
eventBus.on('queue.stateChanged', (queue, transition) => {
  // react to transition.to
});
```

See [Event Bus](event-bus.md) for the state-change event and its payload.

## Best Practices

- **Validate before acting** when the queue's state may have changed since you last observed it
- **Handle the operation's own errors** — the validator answers the state question, not the runtime-precondition question
- **Use state-change events** for reactive components (consumers, autoscalers) rather than polling the validator
- **Reject early on missing queues** — the `QueueNotFoundError` from a `canX` call is a signal that the queue has been deleted, not that the operation is disallowed

## Related

- [Queue State Management](queue-state-management.md) — Pause, resume, stop, and inspect state
- [Queue Management](queue-management.md) — Create, inspect, and delete queues
- [Event Bus](event-bus.md) — React to `queue.stateChanged`
