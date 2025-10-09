[RedisSMQ](../README.md) / [Docs](README.md) / Scheduling Messages

# Scheduling Messages

## Overview

RedisSMQ lets you schedule one-time or recurring message deliveries using per-message options on the ProducibleMessage class:
- `setScheduledDelay(delayMs)` — deliver once after a fixed delay
- `setScheduledCRON(cron)` — deliver on a CRON schedule
- `setScheduledRepeat(n)` — repeat N times after the initial delivery
- `setScheduledRepeatPeriod(periodMs)` — time between repeats
- `resetScheduledParams()` — clear all scheduling options

You produce scheduled messages like any other message using `Producer.produce()`.

## Prerequisites

- Initialize RedisSMQ once per process before creating components:
  - `RedisSMQ.initialize(redisConfig, cb)`, or
  - `RedisSMQ.initializeWithConfig(redisSMQConfig, cb)`
- Create components via RedisSMQ factory methods (recommended):
  - `const producer = RedisSMQ.createProducer()`
- When components are created via RedisSMQ, you typically do not need to shut them down individually. Prefer a 
single `RedisSMQ.shutdown(cb)` at application exit to close shared infrastructure and tracked components.

## Choosing a target

Each scheduled message must target exactly one destination:
- Queue: `ProducibleMessage.setQueue('queue-name')` — fastest routing path (direct queue publishing, no exchange)
- Exchange:
  - Direct: `setDirectExchange('name')` + `setExchangeRoutingKey('key')`
  - Topic: `setTopicExchange('name')` + `setExchangeRoutingKey('pattern')`
  - Fanout: `setFanoutExchange('name')`

If neither a queue nor an exchange is set, producing will fail.

## Examples

### 1) Schedule once with a fixed delay

```javascript
'use strict';

const { RedisSMQ, ProducibleMessage } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
  (err) => {
    if (err) return console.error('Init failed:', err);

    const producer = RedisSMQ.createProducer();
    producer.run((runErr) => {
      if (runErr) return console.error('Producer start failed:', runErr);

      const msg = new ProducibleMessage()
        .setBody({ hello: 'world' })
        .setQueue('test_queue')          // direct queue publishing (fastest)
        .setScheduledDelay(30_000);      // deliver once after 30 seconds

      producer.produce(msg, (e, ids) => {
        if (e) return console.error('Produce failed:', e);
        console.log('Scheduled message IDs:', ids);
      });
    });
  },
);
```

### 2) CRON schedule (daily at 10:00), then repeat 3 times every 10 minutes

```javascript
'use strict';

const { RedisSMQ, ProducibleMessage } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (err) => {
    if (err) return console.error('Init failed:', err);

    const producer = RedisSMQ.createProducer();
    producer.run((runErr) => {
      if (runErr) return console.error('Producer start failed:', runErr);

      // CRON format uses six fields: sec min hour day month weekday
      const msg = new ProducibleMessage()
        .setQueue('reports_queue')
        .setBody({ report: 'daily-stats' })
        .setScheduledCRON('0 0 10 * * *')  // at 10:00:00 every day
        .setScheduledRepeat(3)             // repeat 3 times after the initial run
        .setScheduledRepeatPeriod(600_000);// every 10 minutes

      producer.produce(msg, (e, ids) => {
        if (e) return console.error('Produce failed:', e);
        console.log('CRON-scheduled message IDs:', ids);
      });
    });
  },
);
```

### 3) Repeat N times every X milliseconds (no CRON)

```javascript
'use strict';

const { RedisSMQ, ProducibleMessage } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (err) => {
    if (err) return console.error('Init failed:', err);

    const producer = RedisSMQ.createProducer();
    producer.run((runErr) => {
      if (runErr) return console.error('Producer start failed:', runErr);

      const msg = new ProducibleMessage()
        .setQueue('heartbeat_queue')
        .setBody({ type: 'heartbeat' })
        .setScheduledDelay(5_000)          // initial delivery after 5 seconds
        .setScheduledRepeat(5)             // then 5 repeats
        .setScheduledRepeatPeriod(60_000); // every minute

      producer.produce(msg, (e, ids) => {
        if (e) return console.error('Produce failed:', e);
        console.log('Repeat-scheduled message IDs:', ids);
      });
    });
  },
);
```

### 4) Clearing scheduling options on a reusable message

```javascript
'use strict';

const { ProducibleMessage } = require('redis-smq');

const msg = new ProducibleMessage()
  .setScheduledDelay(10_000)
  .setScheduledRepeat(2);

msg.resetScheduledParams(); // clears CRON, delay, repeat, and repeat period
```

## Managing Scheduled Messages

Use `QueueScheduledMessages` to inspect or purge scheduled messages. Use MessageManager to retrieve or delete a 
specific message by ID.

### Count and list scheduled messages

```javascript
'use strict';

const { RedisSMQ } = require('redis-smq');

const scheduled = RedisSMQ.createQueueScheduledMessages();

// Count scheduled messages
scheduled.countMessages('test_queue', (err, count) => {
  if (err) return console.error('Count failed:', err);
  console.log('Scheduled count:', count);
});

// Paginate scheduled messages (page numbers start at 1)
scheduled.getMessages('test_queue', 1, 50, (e, page) => {
  if (e) return console.error('Get messages failed:', e);
  console.log('Page:', page); // { total, items: IMessageTransferable[], ... }
});
```

### Purge scheduled messages for a queue

```javascript
'use strict';

const { RedisSMQ } = require('redis-smq');

const scheduled = RedisSMQ.createQueueScheduledMessages();
scheduled.purge('test_queue', (err) => {
  if (err) return console.error('Purge failed:', err);
  console.log('Scheduled messages purged for test_queue');
});
```

### Retrieve, delete, or requeue a specific message

```javascript
'use strict';

const { RedisSMQ } = require('redis-smq');

const mm = RedisSMQ.createMessageManager();

// Get message by ID
mm.getMessageById('message-id', (err, msg) => {
  if (err) return console.error('getMessageById failed:', err);
  console.log('Message:', msg);
});

// Delete by ID
mm.deleteMessageById('message-id', (err) => {
  if (err) return console.error('deleteMessageById failed:', err);
  console.log('Message deleted');
});

// Requeue by ID (creates a new message, original is marked as requeued)
mm.requeueMessageById('message-id', (err, newId) => {
  if (err) return console.error('requeueMessageById failed:', err);
  console.log('Requeued as:', newId);
});
```

## Validation and tips

- Units are milliseconds for delays and repeat periods.
- CRON uses six fields: second, minute, hour, day, month, weekday (e.g., `0 0 10 * * *`).
- Repeat and repeat period:
  - `setScheduledRepeat(n)` specifies how many times to deliver after the initial delivery (n >= 0).
  - `setScheduledRepeatPeriod(ms)` specifies the interval between repeats (ms >= 0).
- `setScheduledDelay(ms)` must be a non-negative number.
- Invalid values throw errors during setter calls or when producing; validate input where appropriate.
- TTL interaction: If you set TTL, ensure it doesn’t expire before scheduled deliveries occur.
- Performance: If you know the target queue, prefer direct queue publishing (`setQueue`) over exchanges for lower latency.

## API References

- [ProducibleMessage](api/classes/ProducibleMessage.md):
  - [setScheduledCRON()](api/classes/ProducibleMessage.md#setscheduledcron)
  - [setScheduledDelay()](api/classes/ProducibleMessage.md#setscheduleddelay)
  - [setScheduledRepeat()](api/classes/ProducibleMessage.md#setscheduledrepeat)
  - [setScheduledRepeatPeriod()](api/classes/ProducibleMessage.md#setscheduledrepeatperiod)
  - [resetScheduledParams()](api/classes/ProducibleMessage.md#resetscheduledparams)

- [Producer.produce()](api/classes/Producer.md#produce)
- [QueueScheduledMessages](api/classes/QueueScheduledMessages.md)
- [MessageManager](api/classes/MessageManager.md)
