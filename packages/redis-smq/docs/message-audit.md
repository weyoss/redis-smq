[RedisSMQ](../README.md) / [Docs](README.md) / Message Audit

# Message Audit

Track processed messages for monitoring and debugging. By default, RedisSMQ doesn't store processing history — enable
audit to keep records.

## Overview

![Message audit overview](message-audit.png)

## Quick Start

Enable audit in your configuration:

```javascript
const config = {
  messageAudit: true, // Track both acknowledged and dead-lettered messages
};

RedisSMQ.initializeWithConfig(config, (err) => {
  // Your app...
});
```

Or track specific types:

```javascript
const config = {
  messageAudit: {
    acknowledgedMessages: true, // Track successful messages
    deadLetteredMessages: true, // Track failed messages
  },
};
```

## Why Use Message Audit?

| Without Audit                       | With Audit                                     |
| ----------------------------------- | ---------------------------------------------- |
| Can't see processed message history | Can browse acknowledged/dead-lettered messages |
| Hard to debug failures              | Track which messages failed and why            |
| No processing metrics               | Monitor success/failure rates per queue        |

## Configuration Options

### Basic Tracking

```javascript
const config = {
  messageAudit: true, // Track everything
};
```

### Selective Tracking

```javascript
const config = {
  messageAudit: {
    acknowledgedMessages: true, // Track successes only
    deadLetteredMessages: true, // Track failures only
  },
};
```

### With Limits

```javascript
const config = {
  messageAudit: {
    acknowledgedMessages: {
      queueSize: 5000, // Keep last 5,000 successful messages
      expire: 43200, // Delete after 12 hours (seconds)
    },
    deadLetteredMessages: {
      queueSize: 10000, // Keep last 10,000 failed messages
      expire: 604800, // Delete after 7 days
    },
  },
};
```

## Using Message Audit

### Browse Tracked Messages

```javascript
const { RedisSMQ } = require('redis-smq');

// These work with or without audit
const allMessages = RedisSMQ.createQueueMessages();
const pendingMessages = RedisSMQ.createQueuePendingMessages();

// These REQUIRE audit enabled
const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();

// Count tracked messages
acknowledged.countMessages('my-queue', (err, count) => {
  console.log(`Successfully processed: ${count}`);
});

// Browse recent failures
deadLettered.getMessages('my-queue', 1, 50, (err, page) => {
  console.log('Recent failures:', page.items);
});
```

### Always Available (No Audit Needed)

```javascript
// All messages in queue (including pending, scheduled)
const all = RedisSMQ.createQueueMessages();
all.getMessages('my-queue', 1, 100, (err, page) => {
  console.log('All messages:', page.items);
});

// Pending messages (waiting to be processed)
const pending = RedisSMQ.createQueuePendingMessages();

// Scheduled messages (future delivery)
const scheduled = RedisSMQ.createQueueScheduledMessages();
```

## When to Enable Audit

### ✅ Enable When:

- Debugging message processing issues
- Monitoring queue health and error rates
- Compliance requires processing history
- Analyzing message flow patterns

### ⚠️ Consider Storage Impact:

- Each tracked message uses Redis memory
- High-volume queues need careful limits
- Set appropriate `queueSize` and `expire` values

## Best Practices

1. **Start with dead-letter audit only** if unsure
2. **Set reasonable limits** based on your volume
3. **Monitor Redis memory** when enabling audit
4. **Use for debugging** more than permanent storage
5. **Combine with monitoring** for complete visibility

## Troubleshooting

### "Cannot access acknowledged/dead-lettered messages"

**Solution**: Enable `messageAudit` in your configuration.

### High Redis memory usage

**Solution**:

- Reduce `queueSize` values
- Lower `expire` times
- Disable audit for high-volume queues

### Need to retain history longer

**Solution**: Increase `expire` value or remove expiration entirely.

---

**Related**:

- [Configuration Guide](configuration.md) - Complete setup options
- [Queue Messages API](api/classes/QueueMessages.md) - All message management
