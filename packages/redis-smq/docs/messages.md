[RedisSMQ](../README.md) / [Docs](README.md) / Messages

# Messages

## Overview

The [`ProducibleMessage Class`](api/classes/ProducibleMessage.md) handles application data, commonly known as the message payload, that can be
delivered to a consumer for asynchronous processing.

## Message Payload

The message payload can be any valid JSON-serializable data:
- Simple types: strings, numbers, booleans
- Complex types: objects, arrays
- Nested structures

```javascript
const { ProducibleMessage } = require('redis-smq');

// Simple message
const textMessage = new ProducibleMessage();
textMessage.setBody('Hello world');

// Complex message
const objectMessage = new ProducibleMessage();
objectMessage.setBody({ 
  user: { 
    id: 1001, 
    name: 'John Doe' 
  },
  action: 'user.created',
  timestamp: Date.now()
});
```

## Message Configuration

### Basic Configuration

```javascript
const msg = new ProducibleMessage();
msg
  .setBody({ hello: 'world' })
  .setQueue('my-queue')        // Direct to specific queue
  .setTTL(3600000)             // 1 hour time-to-live
  .setRetryThreshold(5)        // Maximum 5 retry attempts
  .setRetryDelay(30000);       // 30 seconds between retries
```

### Advanced Configuration

```javascript
const msg = new ProducibleMessage();
msg
  .setBody({ data: 'important task' })
  .setPriority(EMessagePriority.HIGHEST)    // Set high priority (for priority queues)
  .setConsumeTimeout(120000)                // 2 minute processing timeout
  .setScheduledDelay(60000)                 // Delay delivery by 1 minute
  .setScheduledRepeat(5)                    // Repeat 5 times
  .setScheduledRepeatPeriod(3600000);       // Repeat every hour
```

## Message Classes Reference

RedisSMQ provides several specialized classes for message management:

| Class | Purpose |
|-------|---------|
| [`ProducibleMessage`](api/classes/ProducibleMessage.md) | Configure and produce messages |
| [`Message`](api/classes/Message.md) | Fetch, delete, or requeue individual messages |
| [`QueueMessages`](api/classes/QueueMessages.md) | Manage all messages within a queue |
| [`QueuePendingMessages`](api/classes/QueuePendingMessages.md) | Manage messages awaiting processing |
| [`QueueAcknowledgedMessages`](api/classes/QueueAcknowledgedMessages.md) | Manage successfully processed messages |
| [`QueueDeadLetteredMessages`](api/classes/QueueDeadLetteredMessages.md) | Manage messages that failed processing |
| [`QueueScheduledMessages`](api/classes/QueueScheduledMessages.md) | Manage messages scheduled for future delivery |

## Message Operations

### Retrieving Messages

```javascript
const { Message } = require('redis-smq');

const messageManager = new Message();

// Get a single message by ID
messageManager.getMessageById('msg-123', (err, message) => {
  if (err) return console.error(err);
  console.log('Retrieved message:', message);
});

// Get multiple messages by IDs
messageManager.getMessagesByIds(['msg-123', 'msg-456'], (err, messages) => {
  if (err) return console.error(err);
  console.log('Retrieved messages:', messages);
});
```

### Deleting Messages

```javascript
const { Message } = require('redis-smq');

const messageManager = new Message();

// Delete a single message
messageManager.deleteMessageById('msg-123', (err) => {
  if (err) return console.error(err);
  console.log('Message deleted successfully');
});

// Delete multiple messages
messageManager.deleteMessagesByIds(['msg-123', 'msg-456'], (err) => {
  if (err) return console.error(err);
  console.log('Messages deleted successfully');
});
```

### Purging Messages

Different message types can be purged using specific classes:

```javascript
const { 
  QueueMessages, 
  QueuePendingMessages,
  QueueAcknowledgedMessages,
  QueueDeadLetteredMessages,
  QueueScheduledMessages 
} = require('redis-smq');

// Purge all messages in a queue
const queueMessages = new QueueMessages();
queueMessages.purge('my-queue', (err) => {
  if (err) return console.error(err);
  console.log('All queue messages purged');
});

// Purge only pending messages
const pendingMessages = new QueuePendingMessages();
pendingMessages.purge('my-queue', (err) => {
  if (err) return console.error(err);
  console.log('Pending messages purged');
});

// Other specialized purge operations
const acknowledgedMessages = new QueueAcknowledgedMessages();
const deadLetteredMessages = new QueueDeadLetteredMessages();
const scheduledMessages = new QueueScheduledMessages();
```

## Message Lifecycle

1. **Creation**: Message is created using `ProducibleMessage`
2. **Configuration**: Message parameters are set (TTL, retry policy, etc.)
3. **Production**: Message is sent to a queue, topic, or fan-out exchange
4. **Pending**: Message awaits processing in the queue
5. **Processing**: Consumer processes the message
6. **Resolution**: Message is either:
    - **Acknowledged**: Successfully processed
    - **Retried**: Failed but within retry threshold
    - **Dead-lettered**: Failed and exceeded retry threshold
    - **Expired**: TTL exceeded before processing

## Best Practices

- Set appropriate TTL values to prevent stale messages
- Configure retry thresholds based on operation criticality
- Use message priorities only when necessary
- Consider using scheduled messages for rate limiting
- Implement proper error handling in message consumers
