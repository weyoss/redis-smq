[RedisSMQ](../README.md) / [Docs](README.md) / Messages

# Messages

## Overview

The [ProducibleMessage Class](api/classes/ProducibleMessage.md) encapsulates application data (the message payload) and
message options (TTL, retries, scheduling, priority, etc.) for asynchronous processing by consumers.

## Message Payload

The message payload can be any valid JSON-serializable data:

- Simple types: strings, numbers, booleans
- Complex types: objects, arrays
- Nested structures

```javascript
'use strict';

const { ProducibleMessage } = require('redis-smq');

// Simple message
const textMessage = new ProducibleMessage().setBody('Hello world');

// Complex message
const objectMessage = new ProducibleMessage().setBody({
  user: { id: 1001, name: 'John Doe' },
  action: 'user.created',
  timestamp: Date.now(),
});
```

## Targeting a Queue or an Exchange

Each message must target exactly one destination:

- Queue
  - `setQueue('queue-name')`
- Direct exchange (requires routing key)
  - `setDirectExchange('exchange-name')`
  - `setExchangeRoutingKey('routing.key')`
- Topic exchange (requires routing key/pattern)
  - `setTopicExchange('exchange-name')`
  - `setExchangeRoutingKey('pattern.like.user.created' or 'user.*' or 'user.#')`
- Fanout exchange (no routing key)
  - `setFanoutExchange('exchange-name')`

If neither a queue nor an exchange is set, producing will fail.

## Message Configuration

### Basic Configuration

```javascript
'use strict';

const { ProducibleMessage } = require('redis-smq');

const msg = new ProducibleMessage()
  .setBody({ hello: 'world' })
  .setQueue('my-queue') // Direct to a specific queue
  .setTTL(3600000) // 1 hour time-to-live (ms)
  .setRetryThreshold(5) // Max 5 retry attempts
  .setRetryDelay(30000); // 30 seconds between retries (ms)
```

### Advanced Configuration

```javascript
'use strict';

const { ProducibleMessage, EMessagePriority } = require('redis-smq');

const msg = new ProducibleMessage()
  .setBody({ task: 'important' })
  .setPriority(EMessagePriority.HIGHEST) // Priority queues only
  .setConsumeTimeout(120000) // 2 minute processing timeout (ms)
  .setScheduledDelay(60000) // Delay delivery by 1 minute (ms)
  .setScheduledRepeat(5) // Repeat 5 times after initial delivery
  .setScheduledRepeatPeriod(3600000); // Repeat every hour (ms)
```

### CRON Scheduling

```javascript
'use strict';

const { ProducibleMessage } = require('redis-smq');

// Daily at 10 AM, then repeat 3 times with 10-minute intervals
const msg = new ProducibleMessage()
  .setBody({ report: 'daily-stats' })
  .setScheduledCRON('0 0 10 * * *')
  .setScheduledRepeat(3)
  .setScheduledRepeatPeriod(600000); // 10 minutes
```

See the full API in [ProducibleMessage](api/classes/ProducibleMessage.md) for all setters and getters.

## Producing Messages

```javascript
'use strict';

const { RedisSMQ, ProducibleMessage } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

// 1) Initialize once per process
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
  (err) => {
    if (err) return console.error('Init failed:', err);

    // 2) Create and start a producer
    const producer = RedisSMQ.createProducer();
    producer.run((runErr) => {
      if (runErr) return console.error('Producer start failed:', runErr);

      // 3) Build and send a message
      const msg = new ProducibleMessage()
        .setQueue('my-queue')
        .setBody({ hello: 'world' });

      producer.produce(msg, (produceErr, messageIds) => {
        if (produceErr) return console.error('Produce failed:', produceErr);
        console.log('Produced message IDs:', messageIds);

        // Preferred at application exit:
        // RedisSMQ.shutdown((e) => e && console.error('Shutdown error:', e));
      });
    });
  },
);
```

## Message Classes Reference

RedisSMQ provides several specialized classes for message management:

| Class                                                                 | Purpose                                       |
| --------------------------------------------------------------------- | --------------------------------------------- |
| [ProducibleMessage](api/classes/ProducibleMessage.md)                 | Configure and produce messages                |
| [MessageManager](api/classes/MessageManager.md)                       | Fetch, delete, or requeue individual messages |
| [QueueMessages](api/classes/QueueMessages.md)                         | Manage all messages within a queue            |
| [QueuePendingMessages](api/classes/QueuePendingMessages.md)           | Manage messages awaiting processing           |
| [QueueAcknowledgedMessages](api/classes/QueueAcknowledgedMessages.md) | Manage successfully processed messages        |
| [QueueDeadLetteredMessages](api/classes/QueueDeadLetteredMessages.md) | Manage messages that failed processing        |
| [QueueScheduledMessages](api/classes/QueueScheduledMessages.md)       | Manage messages scheduled for future delivery |

## Message Operations

All examples below assume RedisSMQ has already been initialized.

### Retrieving and Requeuing Messages

```javascript
'use strict';

const { RedisSMQ } = require('redis-smq');

// Create via RedisSMQ factory (recommended)
const messageManager = RedisSMQ.createMessageManager();

// Get a single message by ID
messageManager.getMessageById('msg-123', (err, message) => {
  if (err) return console.error('getMessageById error:', err);
  console.log('Retrieved message:', message);
});

// Get multiple messages by IDs
messageManager.getMessagesByIds(['msg-123', 'msg-456'], (err, messages) => {
  if (err) return console.error('getMessagesByIds error:', err);
  console.log('Retrieved messages:', messages);
});

// Get message state/status
messageManager.getMessageState('msg-123', (err, state) => {
  if (err) return console.error('getMessageState error:', err);
  console.log('Message state:', state);
});

messageManager.getMessageStatus('msg-123', (err, status) => {
  if (err) return console.error('getMessageStatus error:', err);
  console.log('Message status:', status);
});

// Requeue a message by ID (creates a new message; old one is marked as requeued)
messageManager.requeueMessageById('msg-123', (err, newId) => {
  if (err) return console.error('requeueMessageById error:', err);
  console.log('Requeued as new message ID:', newId);
});
```

### Deleting Messages

```javascript
'use strict';

const { RedisSMQ } = require('redis-smq');

const messageManager = RedisSMQ.createMessageManager();

// Delete a single message
messageManager.deleteMessageById('msg-123', (err) => {
  if (err) return console.error('deleteMessageById error:', err);
  console.log('Message deleted successfully');
});

// Delete multiple messages
messageManager.deleteMessagesByIds(['msg-123', 'msg-456'], (err) => {
  if (err) return console.error('deleteMessagesByIds error:', err);
  console.log('Messages deleted successfully');
});
```

### Purging Messages

Different message types can be purged using specific classes. Prefer creating them via RedisSMQ factory methods.

```javascript
'use strict';

const { RedisSMQ } = require('redis-smq');

// Purge all messages in a queue
const queueMessages = RedisSMQ.createQueueMessages();
queueMessages.purge('my-queue', (err) => {
  if (err) return console.error('Purge all error:', err);
  console.log('All queue messages purged');
});

// Purge only pending messages
const pendingMessages = RedisSMQ.createQueuePendingMessages();
pendingMessages.purge('my-queue', (err) => {
  if (err) return console.error('Purge pending error:', err);
  console.log('Pending messages purged');
});

// Examples for acknowledged, dead-lettered, and scheduled
const acknowledgedMessages = RedisSMQ.createQueueAcknowledgedMessages();
const deadLetteredMessages = RedisSMQ.createQueueDeadLetteredMessages();
const scheduledMessages = RedisSMQ.createQueueScheduledMessages();

// acknowledgedMessages.purge('my-queue', cb);
// deadLetteredMessages.purge('my-queue', cb);
// scheduledMessages.purge('my-queue', cb);
```

## Message Lifecycle

1. Creation: Message is created using ProducibleMessage
2. Configuration: Message parameters are set (TTL, retry policy, scheduling, etc.)
3. Production: Message is sent to a queue or an exchange (topic/direct/fanout)
4. Pending: Message awaits processing in the queue
5. Processing: A consumer processes the message
6. Resolution: Message is either:
   - Acknowledged: Successfully processed
   - Retried: Failed but within retry threshold
   - Dead-lettered: Failed and exceeded retry threshold (if configured to store)
   - Expired: TTL exceeded before processing

## Best Practices

- Set appropriate TTL values to prevent stale messages
- Configure retry thresholds and delays based on operation criticality and downstream behavior
- Use priority only for queues configured as priority queues
- Consider scheduled messages for pacing or backoff strategies
- Use setConsumeTimeout(...) for long-running tasks to detect stalled consumers
- When creating components via RedisSMQ, prefer a single RedisSMQ.shutdown(cb) at application exit instead of shutting
  down instances individually
