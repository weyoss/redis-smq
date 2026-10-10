[RedisSMQ](../README.md) / [Documentation](README.md) / Message Audit

# Message Audit

Browse tracked messages for monitoring and debugging. Requires audit to be enabled in [configuration](configuration.md).

## Audit Types

| Type                     | What It Tracks                      | Requires                                      |
| ------------------------ | ----------------------------------- | --------------------------------------------- |
| Acknowledged             | Successfully processed messages     | `messageAudit.acknowledgedMessages: true`     |
| Dead-Lettered            | Failed messages (retries exhausted) | `messageAudit.deadLetteredMessages: true`     |
| Unacknowledgment History | Failure timeline per message        | `messageAudit.unacknowledgementHistory: true` |

Audit categories are independent. Enabling one does not enable the others. A queue that only needs dead-letter inspection can leave acknowledged-message tracking off, and vice versa.

## Enable Audit

Create a config manager through the `RedisSMQ` factory and use it to change settings:

```javascript
const { RedisSMQ } = require('redis-smq');

const configManager = RedisSMQ.createConfigManager();

await configManager.updateConfig({
  messageAudit: {
    acknowledgedMessages: true,
    deadLetteredMessages: true,
    unacknowledgementHistory: true,
  },
});
```

Changes propagate to every instance connected to the same Redis. See [Configuration](configuration.md) for cross-instance synchronization and storage limits.

## Browse Messages

### Acknowledged Messages

```javascript
const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();

// Count
const count = await acknowledged.countMessages('orders');
console.log(`Successfully processed: ${count}`);

// Browse with pagination
const page = await acknowledged.getMessages('orders', 1, 50);
console.log(`Page has ${page.items.length} of ${page.totalItems} items`);
page.items.forEach((msg) => {
  console.log(`${msg.id}: ${msg.status}`);
});
```

Calling any method on the acknowledged browser while `messageAudit.acknowledgedMessages` is disabled rejects with `AcknowledgmentAuditDisabledError`. The check runs before the Redis call.

### Dead-Lettered Messages

```javascript
const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();

const count = await deadLettered.countMessages('orders');
console.log(`Failed messages: ${count}`);

const page = await deadLettered.getMessages('orders', 1, 100);
page.items.forEach((msg) => {
  console.log(`Failed: ${msg.id} - attempts: ${msg.messageState.attempts}`);
});
```

`attempts` and the other lifecycle counters (`acknowledgedAt`, `deadLetteredAt`, `lastRetriedAttemptAt`) live on `msg.messageState`, not at the top level of the message.

Calling any method on the dead-lettered browser while `messageAudit.deadLetteredMessages` is disabled rejects with `DeadLetterAuditDisabledError`.

### Unacknowledgment History

```javascript
const messageManager = RedisSMQ.createMessageManager();

const history =
  await messageManager.getMessageUnacknowledgementHistory(messageId);
history.forEach((record) => {
  console.log(`Failed at: ${new Date(record.timestamp)}`);
  console.log(`Cause: ${record.cause}`);
  console.log(`Action: ${record.action}`);
  console.log(`Attempt: ${record.retryCount}`);
});
```

Records are ordered newest-first (the underlying Redis list is `LPUSH`-ed on every unacknowledgement). Reverse the array if you need chronological order.

Requires `messageAudit.unacknowledgementHistory` to be enabled. When it is not, the call rejects with `UnacknowledgmentHistoryDisabledError`. A message that has never been unacknowledged returns an empty array.

## Always Available (No Audit Needed)

These message browsers work regardless of audit settings:

```javascript
// All published messages in queue (including acked and dead-lettered messages)
const all = RedisSMQ.createQueuePublishedMessages();

// Pending (waiting to be processed)
const pending = RedisSMQ.createQueuePendingMessages();

// Scheduled (future delivery)
const scheduled = RedisSMQ.createQueueScheduledMessages();
```

The published-messages browser also exposes a status breakdown:

```javascript
const counts = await all.countMessagesByStatus('orders');
// { pending, acknowledged, deadLettered, scheduled }
```

For Point-to-Point queues, `counts.pending` is a number. For Pub/Sub queues, `pending` reflects the queue-level pending list, which does not exist for Pub/Sub — use per-group counts from the pending-messages browser instead.

## Pagination

`getMessages(queue, page, pageSize)` and `getMessageIds(queue, page, pageSize)` both return an `IBrowserPage`:

```ts
interface IBrowserPage<T> {
  totalItems: number;
  items: T[];
}
```

The page is **1-indexed** — page 1 is the first page. `pageSize` is the maximum number of items requested; `items.length` may be smaller if messages were deleted between the ID read and the payload read.

To compute the number of pages:

```javascript
const pageSize = 50;
const page = 1;
const { totalItems, items } = await acknowledged.getMessages(
  'orders',
  page,
  pageSize,
);
const totalPages = Math.ceil(totalItems / pageSize);
console.log(`Page ${page} of ${totalPages}, ${items.length} items`);
```

### `getMessages` vs `getMessageIds`

`getMessageIds` returns the same page shape but with only the message IDs, skipping the payload fetch. Use it when you only need the IDs — it is a much cheaper read than `getMessages`.

## Purging

Each browser exposes an asynchronous purge:

```javascript
const jobId = await acknowledged.purge('orders');
console.log(`Purge job started: ${jobId}`);

// Poll progress
const job = await acknowledged.getPurgeJob('orders', jobId);
console.log(`Purged so far: ${job.meta.purged}`);

// Or just check the status
const status = await acknowledged.getPurgeJobStatus('orders', jobId);
// PENDING | PROCESSING | COMPLETED | FAILED | CANCELED
```

The purge runs as a background job that deletes messages in batches. The queue is locked for the duration. Use `cancelPurge('orders', jobId)` to request cancellation; the worker stops after the current batch completes.

## Performance Impact

- **Disabled (default):** No overhead — no audit lists are written, no counter increments happen on message outcomes.
- **Enabled with limits:** Minimal Redis memory and CPU overhead. Each ack/dead-letter appends one ID to a capped list; the cap and TTL keep storage bounded.
- **Unlimited storage:** The acknowledged and dead-lettered lists grow without bound. On a high-throughput queue, this can consume significant Redis memory over time.

Set appropriate `queueSize` and `expire` values in configuration for production use. See [Configuration](configuration.md) for the units and defaults.

## Related

- [Message Audit Concepts](https://github.com/weyoss/redis-smq-docs) — How audit works
- [Configuration](configuration.md) — Enabling and configuring audit
- [Message Management](message-management.md) — Retrieving individual messages by ID
- [Messages](https://github.com/weyoss/redis-smq-docs) — Message lifecycle
