[RedisSMQ](../README.md) / [Docs](README.md) / Scheduling Messages

# Scheduling Messages

Schedule messages to be delivered once or repeatedly. RedisSMQ supports delayed delivery, CRON schedules, and recurring patterns.

## Quick Start

### Schedule a Delayed Message

```javascript
const { ProducibleMessage } = require('redis-smq');

const msg = new ProducibleMessage()
  .setQueue('notifications') // Direct to queue
  .setBody({ alert: 'Reminder' })
  .setScheduledDelay(30000); // Deliver after 30 seconds

producer.produce(msg, (err, messageIds) => {
  if (err) console.error('Failed:', err);
  else console.log('Scheduled ID:', messageIds[0]);
});
```

### Set Up a CRON Schedule

```javascript
const msg = new ProducibleMessage()
  .setQueue('reports')
  .setBody({ report: 'daily' })
  .setScheduledCRON('0 0 10 * * *'); // Daily at 10:00 AM
```

## Scheduling Options

### One-Time Delay

```javascript
msg.setScheduledDelay(5000); // Deliver after 5 seconds
```

### CRON Schedule

```javascript
msg.setScheduledCRON('0 30 9 * * 1-5'); // Weekdays at 9:30 AM
```

### Recurring Delivery

```javascript
msg.setScheduledDelay(10000); // First delivery after 10s
msg.setScheduledRepeat(5); // Repeat 5 times
msg.setScheduledRepeatPeriod(60000); // Every 60 seconds
```

### Clear Scheduling

```javascript
msg.resetScheduledParams(); // Remove all scheduling
```

## Destination

Each scheduled message needs one destination:

### Option 1: Direct to Queue (Fastest)

```javascript
msg.setQueue('orders'); // No routing key needed
```

### Option 2: Through an Exchange (Requires Routing Key)

```javascript
// Direct Exchange - exact routing key match
msg.setDirectExchange('tasks');
msg.setExchangeRoutingKey('high-priority'); // REQUIRED

// Topic Exchange - pattern matching
msg.setTopicExchange('events');
msg.setExchangeRoutingKey('order.created'); // REQUIRED

// Fanout Exchange - broadcast (no routing key)
msg.setFanoutExchange('notifications'); // Routing key ignored
```

**Important**: When using `setDirectExchange()` or `setTopicExchange()`, you must also call `setExchangeRoutingKey()` before producing.

## Managing Scheduled Messages

### View Scheduled Messages

```javascript
const scheduled = RedisSMQ.createQueueScheduledMessages();

// Count scheduled messages
scheduled.countMessages('my_queue', (err, count) => {
  console.log(`Scheduled: ${count} messages`);
});

// List messages (page 1, 50 per page)
scheduled.getMessages('my_queue', 1, 50, (err, page) => {
  console.log(page.items); // Array of scheduled messages
});
```

### Remove Scheduled Messages

#### Purge All Scheduled Messages for a Queue

```javascript
const scheduled = RedisSMQ.createQueueScheduledMessages();
scheduled.purge('my_queue', (err) => {
  if (!err) console.log('All scheduled messages removed');
});
```

#### Delete Specific Messages by ID

```javascript
const mm = RedisSMQ.createMessageManager();

// Delete single message
mm.deleteMessageById('message-id-123', (err) => {
  if (!err) console.log('Message deleted');
});

// Delete multiple messages
mm.deleteMessagesByIds(['id-1', 'id-2', 'id-3'], (err) => {
  if (!err) console.log('Messages deleted');
});
```

## Important Notes

1. **Scheduled messages cannot be requeued** - The `requeueMessageById()` method is not available for scheduled messages
2. **Use delete instead** - To cancel a scheduled delivery, delete the message by ID
3. **Check message status** - Use `getMessageStatus()` or `getMessageById()` to verify a message is still scheduled before deletion

## Best Practices

1. **Use Direct Queues** when possible for better performance
2. **Always Set Routing Key** when using direct or topic exchanges
3. **Set Appropriate TTL** to ensure messages don't expire before delivery
4. **Validate CRON Expressions** before scheduling
5. **Monitor Scheduled Counts** to prevent queue buildup
6. **Delete, Don't Requeue** - Remove unwanted scheduled messages instead of trying to requeue them

## Common Patterns

### Daily Digest via Direct Queue

```javascript
msg.setQueue('email-digests');
msg.setScheduledCRON('0 0 18 * * *'); // 6 PM daily
msg.setBody({ type: 'daily-summary' });
```

### Event Notification via Topic Exchange

```javascript
msg.setTopicExchange('user-events');
msg.setExchangeRoutingKey('profile.updated'); // Routing key required!
msg.setScheduledDelay(5000);
msg.setBody({ userId: 123, action: 'update' });
```

### Periodic Health Check

```javascript
msg.setQueue('health-checks');
msg.setScheduledDelay(0);
msg.setScheduledRepeat(999); // Repeat indefinitely
msg.setScheduledRepeatPeriod(60000); // Every minute
```

---

**Related Documentation**:

- [ProducibleMessage API](api/classes/ProducibleMessage.md) - All scheduling methods
- [Producer Guide](producing-messages.md) - Basic message production
- [Message Exchanges](message-exchanges.md) - Exchange types and routing
- [MessageManager API](api/classes/MessageManager.md) - Message deletion methods
