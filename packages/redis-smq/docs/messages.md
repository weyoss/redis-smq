[RedisSMQ](../README.md) / [Docs](README.md) / Messages

# Messages

Messages are the core unit of communication in RedisSMQ. Each message contains a payload (your data) and configuration
for how it should be processed.

## Message Basics

### Create a Simple Message

```javascript
const { ProducibleMessage } = require('redis-smq');

const msg = new ProducibleMessage()
  .setBody({ userId: 123, action: 'process' })
  .setQueue('orders'); // Send to queue
```

### Send a Message

```javascript
producer.produce(msg, (err, messageIds) => {
  if (err) console.error('Failed:', err);
  else console.log('Message ID:', messageIds[0]);
});
```

## Message Destination

Every message needs a destination. Choose one:

### Option 1: Direct to Queue (Simplest)

```javascript
msg.setQueue('notifications'); // No routing needed
```

### Option 2: Through an Exchange

```javascript
// Direct Exchange (exact routing key match)
msg.setDirectExchange('tasks');
msg.setExchangeRoutingKey('high-priority'); // REQUIRED

// Topic Exchange (pattern matching)
msg.setTopicExchange('events');
msg.setExchangeRoutingKey('order.created'); // REQUIRED

// Fanout Exchange (broadcast to all)
msg.setFanoutExchange('alerts'); // No routing key needed
```

## Message Configuration

### Delivery Options

```javascript
msg.setTTL(3600000); // Expire after 1 hour
msg.setPriority(EMessagePriority.HIGH); // 2
msg.setConsumeTimeout(30000); // Fail if processing > 30 seconds
```

### Retry Settings

```javascript
msg.setRetryThreshold(3); // Max 3 retries
msg.setRetryDelay(5000); // Wait 5s between retries
```

### Scheduling

```javascript
// Delay delivery
msg.setScheduledDelay(10000); // Deliver after 10 seconds

// CRON schedule
msg.setScheduledCRON('0 0 10 * * *'); // Daily at 10 AM

// Recurring delivery
msg.setScheduledRepeat(5); // Repeat 5 times
msg.setScheduledRepeatPeriod(60000); // Every minute
```

## Managing Messages

### Retrieve Messages

```javascript
const mm = RedisSMQ.createMessageManager();

// Get single message
mm.getMessageById('msg-123', (err, message) => {
  console.log('Message:', message);
});

// Get multiple messages
mm.getMessagesByIds(['msg-1', 'msg-2'], (err, messages) => {
  console.log('Messages:', messages);
});
```

### Delete Messages

```javascript
// Delete single message
mm.deleteMessageById('msg-123', (err) => {
  if (!err) console.log('Deleted');
});

// Delete multiple messages
mm.deleteMessagesByIds(['msg-1', 'msg-2'], (err) => {
  if (!err) console.log('Deleted');
});
```

### Requeue Messages

```javascript
// Move back to queue for reprocessing
mm.requeueMessageById('msg-123', (err, newId) => {
  if (!err) console.log(`Requeued as ${newId}`);
});
```

**Note**: Only acknowledged and dead-lettered messages can be requeued.

## Message Types

Different message states can be managed separately:

```javascript
// Pending (waiting to be processed)
const pending = RedisSMQ.createQueuePendingMessages();
pending.purge('my-queue', (err) => {
  /* Clear all pending */
});

// Acknowledged (successfully processed)
const acked = RedisSMQ.createQueueAcknowledgedMessages();

// Dead-lettered (failed repeatedly)
const dead = RedisSMQ.createQueueDeadLetteredMessages();

// Scheduled (future delivery)
const scheduled = RedisSMQ.createQueueScheduledMessages();
scheduled.purge('my-queue', (err) => {
  /* Cancel all scheduled */
});
```

## Message Lifecycle

1. **Created** → Message built with payload and settings
2. **Queued** → Added to a queue (pending)
3. **Processing** → Consumer handles the message
4. **Resolved** → One of:
   - ✅ **Acknowledged**: Successfully processed
   - 🔄 **Retried**: Failed, will retry later
   - 💀 **Dead-lettered**: Failed too many times
   - ⏰ **Expired**: TTL reached before processing

## Best Practices

1. **Set Reasonable TTLs** - Prevent stale messages
2. **Use Appropriate Retries** - Balance reliability vs. resource usage
3. **Monitor Queue Lengths** - Use provided tools to track backlog
4. **Clean Up Regularly** - Purge old acknowledged/dead-lettered messages
5. **Validate Before Sending** - Ensure destinations and routing keys are correct

---

**Related Documentation**:

- [ProducibleMessage API](api/classes/ProducibleMessage.md) - All message options
- [Producing Messages](producing-messages.md) - How to send messages
- [Consuming Messages](consuming-messages.md) - How to receive messages
