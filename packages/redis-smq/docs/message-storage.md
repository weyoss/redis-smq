
[RedisSMQ](../README.md) / [Docs](README.md) / Message Storage

# Message Storage

## Overview

RedisSMQ stores all messages in Redis data structures, with different storage mechanisms depending on message status and configuration. Understanding these storage patterns is essential for efficient queue management and troubleshooting.

## Default Storage Behavior

By default:

- **All published messages** are stored in their respective queues until explicitly deleted
- **Acknowledged messages** are not retained in separate storage after processing
- **Dead-lettered messages** are not retained in separate storage after failing

This default configuration optimizes Redis memory usage while maintaining core functionality.

## Message Types and Storage Requirements

RedisSMQ provides specialized classes for managing different types of messages:

| Message Type  | Management Class                                                      | Default Storage | Additional Storage Required? |
|---------------|-----------------------------------------------------------------------|-----------------|------------------------------|
| All Messages  | [QueueMessages](api/classes/QueueMessages.md)                         | Main queue      | No                           |
| Scheduled     | [QueueScheduledMessages](api/classes/QueueScheduledMessages.md)       | Scheduled queue | No                           |
| Pending       | [QueuePendingMessages](api/classes/QueuePendingMessages.md)           | Pending queue   | No                           |
| Acknowledged  | [QueueAcknowledgedMessages](api/classes/QueueAcknowledgedMessages.md) | None            | **Yes**                      |
| Dead-lettered | [QueueDeadLetteredMessages](api/classes/QueueDeadLetteredMessages.md) | None            | **Yes**                      |

> **Important:** To use `QueueAcknowledgedMessages` or `QueueDeadLetteredMessages`, you must explicitly enable additional storage for these message types in your configuration.

## Message Lifecycle and Storage

![Message Lifecycle and Storage](message-storage.png)

## Configuration Options

The [`messages.store`](api/interfaces/IRedisSMQConfig.md#messages) configuration allows you to:

1. Enable dedicated storage for acknowledged messages
2. Enable dedicated storage for dead-lettered messages
3. Set retention limits (by count and/or time) for each storage type

### Basic Configuration Structure

```typescript
interface IMessageStoreConfig {
  acknowledged?: boolean | {
    queueSize?: number;
    expire?: number;
  };
  deadLettered?: boolean | {
    queueSize?: number;
    expire?: number;
  };
}
```

Where:
- `queueSize`: Maximum number of messages to store per queue (oldest removed first)
- `expire`: Time in milliseconds before messages are automatically removed

## Configuration Examples

### Example 1: Enable Dead-Lettered Message Storage

```typescript
const config: IRedisSMQConfig = {
  messages: {
    store: {
      deadLettered: true, // Store all dead-lettered messages indefinitely
    },
  },
};
```

### Example 2: Store All Acknowledged Messages, Limit Dead-Lettered Messages

```typescript
const config: IRedisSMQConfig = {
  messages: {
    store: {
      acknowledged: true, // Store all acknowledged messages indefinitely
      deadLettered: {
        queueSize: 100000, // Store up to 100,000 dead-lettered messages per queue
        expire: 24 * 60 * 60 * 1000, // Retain for 1 day (in milliseconds)
      },
    },
  },
};
```

### Example 3: Limit Both Message Types with Different Retention Policies

```typescript
const config: IRedisSMQConfig = {
  messages: {
    store: {
      acknowledged: {
        queueSize: 5000, // Store up to 5,000 acknowledged messages per queue
        expire: 12 * 60 * 60 * 1000, // Retain for 12 hours
      },
      deadLettered: {
        queueSize: 10000, // Store up to 10,000 dead-lettered messages per queue
        expire: 7 * 24 * 60 * 60 * 1000, // Retain for 7 days
      },
    },
  },
};
```

## Accessing Messages Without Additional Storage

Even without enabling additional storage, you can still access individual acknowledged or dead-lettered messages:

```typescript
// Get a specific message by ID
const message = new Message();
message.getMessageById('id1', (err, msg) => {
  if (err) console.error(err);
  else console.log(msg);
});

// Get multiple messages by IDs
message.getMessagesByIds(['id1', 'id2'], (err, messages) => {
  if (err) console.error(err);
  else console.log(messages);
});

// Browse all messages (including acknowledged and dead-lettered)
const queueMessages = new QueueMessages();
queueMessages.getMessages('my-queue', 1, 100, (err, page) => {
  if (err) console.error(err);
  else console.log(page);
});
```

## Storage Considerations

When configuring message storage, consider:

1. **Memory usage**: Storing all acknowledged messages may increase Redis memory consumption
2. **Performance**: Larger storage may impact Redis performance, especially with high-throughput queues
3. **Monitoring needs**: Balance retention requirements against system resources

## Best Practices

- Enable acknowledged message storage only when message history tracking is required
- Always enable dead-lettered message storage in production for troubleshooting failed messages
- Set reasonable size limits based on your queue throughput and available memory
- Configure time-based expiration for compliance with data retention policies
- Monitor Redis memory usage when using extensive message storage

## Summary

- By default, only the main queue is persisted
- To manage acknowledged or dead-lettered messages via their dedicated classes, configure `messages.store`
- Balance storage needs against system resources and performance requirements
- Use time and size limits to prevent unbounded growth of message storage
