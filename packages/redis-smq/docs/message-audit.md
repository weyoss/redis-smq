# Message Audit

Browse tracked messages for monitoring and debugging. Requires audit to be enabled in [configuration](configuration.md).

## Audit Types

| Type                     | What It Tracks                      | Requires                                      |
| ------------------------ | ----------------------------------- | --------------------------------------------- |
| Acknowledged             | Successfully processed messages     | `messageAudit.acknowledgedMessages: true`     |
| Dead-Lettered            | Failed messages (retries exhausted) | `messageAudit.deadLetteredMessages: true`     |
| Unacknowledgment History | Failure timeline per message        | `messageAudit.unacknowledgementHistory: true` |

## Enable Audit

```javascript
const configManager = new ConfigManager();

await configManager.updateConfig({
  messageAudit: {
    acknowledgedMessages: true,
    deadLetteredMessages: true,
    unacknowledgementHistory: true,
  },
});
```

## Browse Messages

### Acknowledged Messages

```javascript
const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();

// Count
acknowledged.countMessages('orders', (err, count) => {
  console.log(`Successfully processed: ${count}`);
});

// Browse with pagination
acknowledged.getMessages('orders', 1, 50, (err, page) => {
  console.log(`Page ${page.currentPage} of ${page.totalPages}`);
  console.log('Messages:', page.items);
});
```

### Dead-Lettered Messages

```javascript
const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();

deadLettered.countMessages('orders', (err, count) => {
  console.log(`Failed messages: ${count}`);
});

deadLettered.getMessages('orders', 1, 100, (err, page) => {
  page.items.forEach((msg) => {
    console.log(`Failed: ${msg.id} - attempts: ${msg.attempts}`);
  });
});
```

### Unacknowledgment History

```javascript
const messageManager = RedisSMQ.createMessageManager();

messageManager.getMessageUnacknowledgementHistory(messageId, (err, history) => {
  history.forEach((record) => {
    console.log(`Failed at: ${new Date(record.timestamp)}`);
    console.log(`Cause: ${record.cause}`);
    console.log(`Action: ${record.action}`);
    console.log(`Attempt: ${record.retryCount}`);
  });
});
```

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

## Pagination

All `getMessages` methods support pagination:

```javascript
// Page 1, 50 items per page
acknowledged.getMessages('orders', 1, 50, (err, page) => {
  console.log(`Page ${page.currentPage} of ${page.totalPages}`);
  console.log(`Items: ${page.items.length}`);
  console.log(`Has more: ${page.hasNext}`);
});
```

## Performance Impact

- **Disabled (default):** No overhead
- **Enabled with limits:** Minimal Redis memory and CPU overhead
- **Unlimited storage:** Can consume significant memory over time

Set appropriate `queueSize` and `expire` values in configuration for production use.

## Related

- [Message Audit Concepts](https://github.com/weyoss/redis-smq-docs) — How audit works
- [Configuration](configuration.md) — Enabling and configuring audit
- [Messages](https://github.com/weyoss/redis-smq-docs) — Message lifecycle
