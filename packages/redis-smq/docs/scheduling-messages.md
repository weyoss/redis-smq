[RedisSMQ](../README.md) / [Documentation](README.md) / Scheduling Messages

# Scheduling Messages

Schedule messages for future delivery using delays, CRON expressions, or repeating patterns.

A message with scheduling parameters is not placed in the pending queue when produced. It goes into a sorted set scored by its next delivery timestamp; a background worker moves it to the pending queue when the timestamp arrives. The producer's `produce()` call resolves immediately, with the message's ID, whether or not the message will actually fire later.

## Quick Start

```javascript
const { RedisSMQ } = require('redis-smq');

const msg = RedisSMQ.newProducibleMessage()
  .setQueue('notifications')
  .setBody({ alert: 'Reminder' })
  .setScheduledDelay(30000); // Deliver after 30 seconds

const [id] = await producer.produce(msg);
console.log('Scheduled:', id);
```

## Scheduling Options

### One-Time Delay

```javascript
msg.setScheduledDelay(5000); // Deliver after 5 seconds
```

A message with only a delay is delivered exactly once, at `now + delay`. It is not periodic.

### CRON Schedule

```javascript
msg.setScheduledCRON('0 30 9 * * 1-5'); // Weekdays at 9:30:00 AM
```

CRON expressions are validated when set. Invalid expressions — wrong field count, non-numeric fields, unparseable patterns — throw `InvalidCronExpressionError` at the point of the `setScheduledCRON` call, not at `produce()` time and not silently.

Both 5-field (standard Unix) and 6-field formats are accepted:

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

A 5-field expression is parsed as if its seconds field were `0` — the parser, not the library, applies the implicit seconds. Both of these are equivalent:

```javascript
msg.setScheduledCRON('30 9 * * 1-5'); // 5-field — parsed as 0 30 9 * * 1-5
msg.setScheduledCRON('0 30 9 * * 1-5'); // 6-field — seconds explicit
```

The expression is stored verbatim; if you call `getScheduledCRON()` on a message that was set with the 5-field form, it returns the 5-field string.

### Repeating Delivery

```javascript
msg.setScheduledDelay(10000); // First delivery after 10s
msg.setScheduledRepeat(5); // Repeat 5 times after the first delivery
msg.setScheduledRepeatPeriod(60000); // Every 60 seconds between repeats
```

`setScheduledRepeat(n)` schedules **n repeats after the initial delivery** — so `setScheduledRepeat(5)` with the settings above produces 6 total deliveries: one at `now + 10000`, then five more at 60-second intervals after that.

A repeat count of `0` means **no repeats** — the message is delivered once and stops being schedulable. This is the default. If you want a message to fire periodically with no upper bound, use a CRON expression without a repeat count:

```javascript
msg.setScheduledCRON('* * * * *'); // Every minute, indefinitely
```

`setScheduledRepeatPeriod` applies only when `setScheduledRepeat(n)` has been called with `n > 0`. Setting a repeat period without a repeat count has no effect.

### Combining CRON and Repeat

When both are set, the CRON expression acts as a trigger and the repeat count acts as a burst between CRON ticks. Each CRON tick resets the repeat counter:

```javascript
msg.setScheduledCRON('0 0 * * *'); // Top of every hour
msg.setScheduledRepeat(3); // 3 repeats between hours
msg.setScheduledRepeatPeriod(60000); // Every minute
```

The first delivery happens at the top of the hour; the message then repeats at 1, 2, and 3 minutes past. At the top of the next hour, the CRON fires again and the cycle restarts.

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
const count = await scheduled.countMessages('orders');
console.log(`Scheduled: ${count}`);

// Browse with pagination
const page = await scheduled.getMessages('orders', 1, 50);
page.items.forEach((msg) => {
  console.log(`${msg.id} — next delivery at ${new Date(msg.scheduledAt)}`);
});
```

Scheduled messages are stored in a Redis sorted set scored by their next delivery timestamp, so a page of scheduled messages is ordered by when they will next fire — not by when they were produced.

### Delete Scheduled Messages

```javascript
const messageManager = RedisSMQ.createMessageManager();

// Delete by ID
await messageManager.deleteMessageById(messageId);

// Delete multiple
await messageManager.deleteMessagesByIds([id1, id2]);
```

Deleting a scheduled message cancels it — the message hash and its entry in the scheduled set are both removed. See [Message Management](message-management.md) for the delete response shape.

### Purge All Scheduled

```javascript
const jobId = await scheduled.purge('orders');
console.log(`Purge job started: ${jobId}`);

let status = await scheduled.getPurgeJobStatus('orders', jobId);
while (status === 'PENDING' || status === 'PROCESSING') {
  await new Promise((resolve) => setTimeout(resolve, 250));
  status = await scheduled.getPurgeJobStatus('orders', jobId);
}
console.log(`Purge ${status.toLowerCase()}`);
```

`purge` enqueues a background job — it resolves with a job ID, not with the deletion itself. See [Message Audit](message-audit.md) for the full job lifecycle (`getPurgeJob`, `cancelPurge`, and the status values).

## Important Notes

- **Scheduled messages cannot be requeued.** Only messages in the `ACKNOWLEDGED` or `DEAD_LETTERED` state can be requeued; a scheduled message is in the `SCHEDULED` state, so `requeueMessageById` rejects with `MessageNotRequeuableError`. To cancel a scheduled message, delete it.
- **CRON expressions are validated at set time.** An invalid expression throws `InvalidCronExpressionError` from `setScheduledCRON`. Nothing is silently ignored.
- **Scheduled messages are stored in a sorted set** scored by their next delivery timestamp.
- **A background worker promotes due messages** to the pending queue. The worker ticks once per second and processes up to 100 due messages per tick.
- **Scheduling parameters are validated for TTL and formatting** at set time; a value that fails validation (e.g., a negative delay) throws `MessagePropertyInvalidValueError`.

## Common Patterns

### Daily Report

```javascript
const msg = RedisSMQ.newProducibleMessage()
  .setQueue('reports')
  .setScheduledCRON('0 0 18 * * *') // 6 PM daily
  .setBody({ type: 'daily-summary' });
```

### Delayed Reminder

```javascript
const msg = RedisSMQ.newProducibleMessage()
  .setQueue('emails')
  .setScheduledDelay(3600000) // 1 hour from now
  .setBody({ type: 'abandoned-cart' });
```

### Periodic Health Check

To run something indefinitely on a fixed interval, use CRON rather than a repeat count:

```javascript
const msg = RedisSMQ.newProducibleMessage()
  .setQueue('health-checks')
  .setScheduledCRON('* * * * *') // Every minute
  .setBody({ check: 'api' });
```

For a bounded number of firings, use a repeat count instead:

```javascript
const msg = RedisSMQ.newProducibleMessage()
  .setQueue('health-checks')
  .setScheduledRepeat(10) // 10 firings after the first
  .setScheduledRepeatPeriod(60000) // Every minute
  .setBody({ check: 'api' });
```

### Burst at the Top of Every Hour

```javascript
const msg = RedisSMQ.newProducibleMessage()
  .setQueue('metrics')
  .setScheduledCRON('0 0 * * *') // Top of every hour
  .setScheduledRepeat(5) // 5 repeats per hour
  .setScheduledRepeatPeriod(30000) // Every 30 seconds
  .setBody({ aggregate: 'hourly' });
```

## Related

- [Scheduling Messages Concepts](https://github.com/weyoss/redis-smq-docs) — How scheduling works
- [Producing Messages](producing-messages.md) — The rest of the `ProducibleMessage` API
- [Message Management](message-management.md) — Deleting and requeuing messages
- [Message Audit](message-audit.md) — Purging and pagination details
