[RedisSMQ](../README.md) / [Documentation](README.md) / Scheduling Messages

# Scheduling Messages

Schedule messages for future delivery using delays, CRON expressions, or repeating patterns.

## Quick Start

```javascript
const { ProducibleMessage } = require('redis-smq');

// Delay delivery by 30 seconds
const msg = new ProducibleMessage()
  .setQueue('notifications')
  .setBody({ alert: 'Reminder' })
  .setScheduledDelay(30000);

producer.produce(msg, (err, ids) => {
  console.log('Scheduled:', ids[0]);
});
```

## Scheduling Options

### One-Time Delay

```javascript
msg.setScheduledDelay(5000); // Deliver after 5 seconds
```

### CRON Schedule

```javascript
msg.setScheduledCRON('0 30 9 * * 1-5'); // Weekdays at 9:30:00 AM
```

CRON expressions can be specified in either the standard 5‑field format (minute, hour, day‑of‑month, month, day‑of‑week) or a 6‑field format that includes seconds as the first component. When using 5 fields, RedisSMQ automatically interprets the seconds as `0`.

The 6‑field format is shown below:

```
┌──────────── second (0–59)
│ ┌──────────── minute (0–59)
│ │ ┌──────────── hour (0–23)
│ │ │ ┌──────────── day of month (1–31)
│ │ │ │ ┌──────────── month (1–12)
│ │ │ │ │ ┌──────────── day of week (0–6, Sunday=0)
│ │ │ │ │ │
* * * * * *
```

Examples:

```javascript
// 5‑field (seconds assumed 0)
msg.setScheduledCRON('30 9 * * 1-5'); // Weekdays at 9:30:00 AM

// 6‑field (explicit seconds)
msg.setScheduledCRON('0 30 9 * * 1-5'); // Weekdays at 9:30:00 AM
```

### Repeating Delivery

```javascript
msg.setScheduledDelay(10000); // First delivery after 10s
msg.setScheduledRepeat(5); // Repeat 5 times
msg.setScheduledRepeatPeriod(60000); // Every 60 seconds
```

A repeat count of `0` means repeat indefinitely.

### Combining Options

```javascript
// CRON + Repeat: deliver on schedule, repeat between CRON ticks
msg.setScheduledCRON('0 0 * * *'); // Every hour
msg.setScheduledRepeat(3); // Repeat 3 times
msg.setScheduledRepeatPeriod(60000); // Every minute between hours
```

### Clear Scheduling

```javascript
msg.resetScheduledParams(); // Remove all scheduling
```

## Destination

Scheduled messages need a destination, same as regular messages:

```javascript
// Direct to queue
msg.setQueue('orders');

// Via exchange
msg.setDirectExchange('tasks');
msg.setExchangeRoutingKey('high-priority');
```

## Managing Scheduled Messages

### View Scheduled Messages

```javascript
const scheduled = RedisSMQ.createQueueScheduledMessages();

// Count
scheduled.countMessages('orders', (err, count) => {
  console.log(`Scheduled: ${count}`);
});

// Browse with pagination
scheduled.getMessages('orders', 1, 50, (err, page) => {
  console.log('Scheduled messages:', page.items);
});
```

### Delete Scheduled Messages

```javascript
const messageManager = RedisSMQ.createMessageManager();

// Delete by ID
messageManager.deleteMessageById(messageId, (err) => {
  if (!err) console.log('Scheduled message cancelled');
});

// Delete multiple
messageManager.deleteMessagesByIds([id1, id2], (err) => {
  if (!err) console.log('Messages cancelled');
});
```

### Purge All Scheduled

```javascript
scheduled.purge('orders', (err) => {
  if (!err) console.log('All scheduled messages removed');
});
```

## Important Notes

- **Scheduled messages cannot be requeued** — use `deleteMessageById()` to cancel
- **CRON expressions are validated** — invalid expressions are silently ignored
- **Scheduled messages use a sorted set** — ordered by delivery timestamp
- **A background worker moves due messages** to the pending queue every 5 seconds

## Common Patterns

### Daily Report

```javascript
msg.setQueue('reports');
msg.setScheduledCRON('0 0 18 * * *'); // 6 PM daily
msg.setBody({ type: 'daily-summary' });
```

### Delayed Retry Notification

```javascript
msg.setQueue('emails');
msg.setScheduledDelay(3600000); // Reminder in 1 hour
msg.setBody({ type: 'abandoned-cart' });
```

### Periodic Health Check

```javascript
msg.setQueue('health-checks');
msg.setScheduledRepeat(0); // Repeat indefinitely
msg.setScheduledRepeatPeriod(60000); // Every minute
```

## Related

- [Scheduling Messages Concepts](https://github.com/weyoss/redis-smq-docs) — How scheduling works
- [Producing Messages](producing-messages.md) — How to publish messages
