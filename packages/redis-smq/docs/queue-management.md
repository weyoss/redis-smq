[RedisSMQ](../README.md) / [Documentation](README.md) / Queue Management

# Queue Management

Create, inspect, and delete queues.

## Quick Start

```javascript
const { RedisSMQ, EQueueType, EQueueDeliveryModel } = require('redis-smq');
const queueManager = RedisSMQ.createQueueManager();
```

## Create a Queue

```javascript
await queueManager.save(
  'orders',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
);
console.log('Queue created');
```

`save` resolves with `{ queue, properties }` — the canonical queue parameters (with the namespace resolved if the input was a bare name) and the queue's initial property set.

Attempting to create a queue that already exists rejects with `QueueAlreadyExistsError`. Queue type and delivery model are fixed at creation time and cannot be changed without deleting and recreating the queue.

### Queue Types

| Type     | Constant                    | Description               |
| -------- | --------------------------- | ------------------------- |
| FIFO     | `EQueueType.FIFO_QUEUE`     | First in, first out       |
| LIFO     | `EQueueType.LIFO_QUEUE`     | Last in, first out        |
| Priority | `EQueueType.PRIORITY_QUEUE` | Ordered by priority level |

### Delivery Models

| Model          | Constant                             | Description                  |
| -------------- | ------------------------------------ | ---------------------------- |
| Point-to-Point | `EQueueDeliveryModel.POINT_TO_POINT` | One consumer per message     |
| Pub/Sub        | `EQueueDeliveryModel.PUB_SUB`        | Broadcast to consumer groups |

### With Namespace

```javascript
// Explicit namespace
await queueManager.save(
  { ns: 'production', name: 'orders' },
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
);

// Default namespace (from configuration)
await queueManager.save(
  'orders',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
);
```

See [Namespaces](namespaces.md) for the default-namespace fallback rules.

## Inspect Queues

### Check if Exists

```javascript
const exists = await queueManager.exists('orders');
console.log('Exists:', exists);
```

### List All Queues

Returns every queue in every namespace:

```javascript
const queues = await queueManager.getQueues();
queues.forEach((q) => {
  console.log(`${q.name}@${q.ns}`);
});
```

### Get Queue Properties

```javascript
const props = await queueManager.getProperties('orders');

console.log('Type:', EQueueType[props.queueType]);
console.log('Delivery model:', EQueueDeliveryModel[props.deliveryModel]);
console.log('State:', EQueueOperationalState[props.operationalState]);

console.log('Total messages:', props.messagesCount);
console.log('Pending:', props.pendingMessagesCount);
console.log('Processing:', props.processingMessagesCount);
console.log('Scheduled:', props.scheduledMessagesCount);
console.log('Delayed:', props.delayedMessagesCount);
console.log('Requeued:', props.requeuedMessagesCount);
console.log('Acknowledged:', props.acknowledgedMessagesCount);
console.log('Dead-lettered:', props.deadLetteredMessagesCount);
```

The `queueType`, `deliveryModel`, and `operationalState` fields are enum values (numbers). Indexing the corresponding enum with the value returns its name — `EQueueType[props.queueType]` prints `'FIFO_QUEUE'` rather than `1`.

`messagesCount` counts **message records** — the message hashes that exist for this queue. A message that has been acknowledged or dead-lettered still contributes to `messagesCount` until it is explicitly deleted; only the state-specific counters (`acknowledgedMessagesCount`, `deadLetteredMessagesCount`, and so on) reflect the message's current state.

Fails with `QueueNotFoundError` if the queue does not exist.

### Get Consumers

```javascript
// All consumers with their reported network info
const consumers = await queueManager.getConsumers('orders');
for (const [consumerId, info] of Object.entries(consumers)) {
  console.log(`${consumerId}: pid=${info.pid} host=${info.hostname}`);
}

// Just the IDs
const ids = await queueManager.getConsumerIds('orders');
console.log('Consumer count:', ids.length);
```

Both fail with `QueueNotFoundError` if the queue does not exist. An existing queue with no consumers returns an empty object (or empty array, for `getConsumerIds`).

## Delete a Queue

```javascript
await queueManager.delete('old-queue');
console.log('Queue deleted');
```

The queue must be empty of **message records** before deletion is allowed. A message record is the message's own hash and, if unacknowledgement-history audit is enabled, its history list. These keys live outside the queue's namespace and are unreachable from any queue-level structure, so a queue that still has them cannot be deleted without orphaning them.

**Processing every pending message is not enough.** Acknowledging or dead-lettering a message transitions its state but does not delete its hash. The precondition is that the queue's `messagesCount` counter is zero, and only explicit message deletion decrements that counter.

### Deleting a Queue That Has Accepted Messages

Enqueue a purge job for the published list, wait for it to complete, then delete the queue:

```javascript
const published = RedisSMQ.createQueuePublishedMessages();

const jobId = await published.purge('orders');
let status = await published.getPurgeJobStatus('orders', jobId);
while (status === 'PENDING' || status === 'PROCESSING') {
  await new Promise((resolve) => setTimeout(resolve, 250));
  status = await published.getPurgeJobStatus('orders', jobId);
}
if (status !== 'COMPLETED') {
  throw new Error(`Purge did not complete: ${status}`);
}

await queueManager.delete('orders');
```

If acknowledged-message or dead-lettered-message audit is enabled, those categories hold records in their own lists. Purge them too:

```javascript
const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();

await acknowledged.purge('orders');
await deadLettered.purge('orders');
// ... wait for both purge jobs to reach COMPLETED ...
await queueManager.delete('orders');
```

Alternatively, delete the messages individually:

```javascript
const published = RedisSMQ.createQueuePublishedMessages();
const messageManager = RedisSMQ.createMessageManager();

let page = await published.getMessageIds('orders', 1, 1000);
while (page.items.length > 0) {
  await messageManager.deleteMessagesByIds(page.items);
  page = await published.getMessageIds('orders', 1, 1000);
}

await queueManager.delete('orders');
```

### Deletion Errors

| Error                          | Cause                                | Resolution                    |
| ------------------------------ | ------------------------------------ | ----------------------------- |
| `QueueNotFoundError`           | The queue does not exist.            | —                             |
| `QueueNotEmptyError`           | The queue still has message records. | Purge or delete them first.   |
| `QueueHasActiveConsumersError` | A consumer is still subscribed.      | Stop the consumers.           |
| `QueueHasBoundExchangesError`  | An exchange is bound to the queue.   | Unbind the exchanges first.   |
| `QueueLockedError`             | The queue is LOCKED.                 | Wait for the lock to release. |

### What Gets Deleted

All queue-level state: properties, all message-ID lists and sorted sets (pending, scheduled, delayed, requeued, acknowledged, dead-lettered), per-consumer processing queues, per-consumer-group pending and priority structures, exchange bindings, consumer registrations, and state history.

Message records are not touched by `delete` — by the time the deletion is allowed to proceed, none remain.

## Promise Style

Every method above supports both callback and promise forms. The promise form is shown throughout; the callback form passes an `(err, result)` callback as the last argument:

```javascript
queueManager.save(
  'orders',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err, result) => {
    if (err) console.error(err);
    else console.log('Created:', result.queue);
  },
);
```

## Related

- [Queues Concepts](https://github.com/weyoss/redis-smq-docs) — Queue types and behavior
- [Queue Delivery Models](https://github.com/weyoss/redis-smq-docs) — Point-to-Point vs Pub/Sub
- [Queue State Management](queue-state-management.md) — Pause, resume, stop, and inspect state
- [Queue Rate Limiting](queue-rate-limiting.md) — Control throughput
- [Message Management](message-management.md) — Retrieve, delete, and requeue individual messages
- [Message Audit](message-audit.md) — Purging acknowledged and dead-lettered lists
