[RedisSMQ](../README.md) / [Docs](README.md) / Message Audit

# Message Audit

## Overview

Message audit creates dedicated storage to track processed messages by storing their IDs. This enables efficient
monitoring and analysis of acknowledged and dead-lettered messages per queue.

## How It Works

**All messages are always stored** in their respective queues until explicitly deleted.

**When message audit is enabled:**

- Additional dedicated storage is created for processed message IDs
- Acknowledged message IDs are stored separately per queue
- Dead-lettered message IDs are stored separately per queue
- [QueueAcknowledgedMessages](api/classes/QueueAcknowledgedMessages.md) and [QueueDeadLetteredMessages](api/classes/QueueDeadLetteredMessages.md) allow to browse these tracked messages

**Without message audit:**

- No dedicated storage for processed message tracking
- [QueueAcknowledgedMessages](api/classes/QueueAcknowledgedMessages.md) and [QueueDeadLetteredMessages](api/classes/QueueDeadLetteredMessages.md) are not useful
- You can still browse all messages using [QueueMessages](api/classes/QueueMessages.md)

## Configuration

See:

- [Configuration Interface](api/interfaces/IRedisSMQConfig.md#messageaudit).
- [IMessageAuditConfig Interface](api/interfaces/IMessageAuditConfig.md)

### Examples

**Create storage for all processed messages tracking:**

```typescript
const config: IRedisSMQConfig = {
  messageAudit: true,
};
```

**Create storage for dead-lettered message tracking:**

```typescript
const config: IRedisSMQConfig = {
  messageAudit: {
    deadLetteredMessages: true,
  },
};
```

**Create storage with limits:**

```typescript
const config: IRedisSMQConfig = {
  messageAudit: {
    acknowledgedMessages: {
      queueSize: 5000, // store last 5,000 message IDs per queue
      expire: 12 * 60 * 60, // keep IDs for 12 hours
    },
    deadLetteredMessages: {
      queueSize: 10000, // store last 10,000 message IDs per queue
      expire: 7 * 24 * 60 * 60, // keep IDs for 7 days
    },
  },
};
```

## Queue Explorer Classes

| Class                       | Purpose                                | Requires Message Audit               |
| --------------------------- | -------------------------------------- | ------------------------------------ |
| `QueueMessages`             | All messages in queue                  | No                                   |
| `QueuePendingMessages`      | Messages waiting to be processed       | No                                   |
| `QueueScheduledMessages`    | Messages scheduled for future delivery | No                                   |
| `QueueAcknowledgedMessages` | Successfully processed messages        | **Yes** - requires dedicated storage |
| `QueueDeadLetteredMessages` | Messages that failed processing        | **Yes** - requires dedicated storage |

### Usage Examples

```javascript
const { RedisSMQ } = require('redis-smq');

RedisSMQ.initialize(config, (err) => {
  if (err) throw err;

  // These work without message audit
  const allMessages = RedisSMQ.createQueueMessages();
  const pendingMessages = RedisSMQ.createQueuePendingMessages();

  // These require message audit to be enabled (dedicated storage must exist)
  const acknowledgedMessages = RedisSMQ.createQueueAcknowledgedMessages();
  const deadLetteredMessages = RedisSMQ.createQueueDeadLetteredMessages();

  // Browse all messages in queue
  allMessages.getMessages('my-queue', 1, 100, (err, page) => {
    console.log('All messages in queue:', page.items);
  });

  // Access tracked dead-lettered messages (requires audit enabled)
  deadLetteredMessages.countMessages('my-queue', (err, count) => {
    console.log('Tracked dead-lettered messages:', count);
  });

  // Access any message by ID
  const messageManager = RedisSMQ.createMessageManager();
  messageManager.getMessageById('message-id', (err, message) => {
    console.log('Message:', message);
  });
});
```

## When to Enable Message Audit

**Enable acknowledged message audit when:**

- You need to track successful processing rates by queue
- Compliance requires acknowledged message history per queue
- You're analyzing queue-specific performance patterns

**Enable dead-lettered message audit when:**

- You need to troubleshoot failures by queue
- You want to monitor error rates per queue
- You're debugging queue-specific processing issues

## Storage Considerations

**Dedicated storage impact:**

- `queueSize`: Limits how many message IDs are stored per queue
- `expire`: Controls how long message IDs are retained in dedicated storage
- Each enabled audit type creates separate Redis storage structures

**Resource management:**

- Monitor Redis memory usage as audit storage grows
- Higher message throughput requires larger `queueSize` limits
- Consider the trade-off between tracking capability and storage overhead

## Troubleshooting

**"Cannot access acknowledged/dead-lettered messages"**

- Ensure message audit is enabled for the specific message type

**High Redis memory usage**

- Reduce `queueSize` limits to store fewer message IDs
- Decrease `expire` times to retain IDs for shorter periods
- Consider disabling audit for high-throughput queues
