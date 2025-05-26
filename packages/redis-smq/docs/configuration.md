[RedisSMQ](../README.md) / [Docs](README.md) / Configuration

# Configuration

Setting up RedisSMQ requires a one-time configuration, typically performed during the initialization of your application.
This setup must be completed before utilizing any exported classes or functions from the RedisSMQ library.

## Singleton Configuration Class

RedisSMQ provides a singleton class for configuration. Below is an example of how to set it up:

```typescript
import { Configuration, IRedisSMQConfig } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

const config: IRedisSMQConfig = {
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
};

Configuration.getSetConfig(config);
```

For more detailed information, please refer to the [Configuration Reference](api/classes/Configuration.md).

## Configuration parameters

For an in-depth understanding of configuration options, see the [IRedisSMQConfig Interface](api/interfaces/IRedisSMQConfig.md).

### Example Configuration

Here’s an example of a complete RedisSMQ configuration:

```typescript
import { IRedisSMQConfig } from 'redis-smq';
import { ERedisConfigClient, EConsoleLoggerLevel } from 'redis-smq-common'

const config: IRedisSMQConfig = {
  namespace: 'my_project_name',
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
      connect_timeout: 3600000, // 1 hour
    },
  },
  logger: {
    enabled: true,
    options: {
      logLevel: EConsoleLoggerLevel.INFO,
      //...
    },
  },
  messages: {
    store: false, // Set to true to enable message storage
  },
  eventBus: {
    enabled: false, // Set to true to enable the event bus
  },
};
```

### Message Storage

#### Default Behavior

- **All published messages** are stored in their respective queues until explicitly deleted.
- **Acknowledged** and **dead-lettered** messages are **not** stored in dedicated lists by default; they remain accessible only as part of the main queue until removed.

#### Browsing and Managing Messages

RedisSMQ provides several classes for browsing and managing messages by type:

| Class                                                                 | Purpose                                   | Requires Additional Storage? |
|-----------------------------------------------------------------------|-------------------------------------------|------------------------------|
| [QueueMessages](api/classes/QueueMessages.md)                         | Browse/manage all messages (any status)   | No                           |
| [QueueScheduledMessages](api/classes/QueueScheduledMessages.md)       | Browse/manage only scheduled messages     | No                           |
| [QueuePendingMessages](api/classes/QueuePendingMessages.md)           | Browse/manage only pending messages       | No                           |
| [QueueAcknowledgedMessages](api/classes/QueueAcknowledgedMessages.md) | Browse/manage only acknowledged messages  | Yes                          |
| [QueueDeadLetteredMessages](api/classes/QueueDeadLetteredMessages.md) | Browse/manage only dead-lettered messages | Yes                          |

> **Note:** To use `QueueAcknowledgedMessages` or `QueueDeadLetteredMessages`, you must enable additional storage for these message types in your configuration.

#### Enabling Storage for Acknowledged and Dead-Lettered Messages

The `messages.store` option allows you to configure dedicated storage for acknowledged and/or dead-lettered messages, making them accessible via their specialized classes.

Even without additional storage, acknowledged/dead-lettered messages can be retrieved:
- By ID using [`Message.getMessageById()`](api/classes/Message.md#getmessagebyid)
- By browsing all messages with [`QueueMessages.getMessages()`](api/classes/QueueMessages.md#getmessages)

To specifically retrieve and manage all acknowledged/dead-lettered messages for a queue (e.g., for monitoring or analytics), enable dedicated storage and use the [`QueueAcknowledgedMessages`](api/classes/QueueAcknowledgedMessages.md)/[`QueueDeadLetteredMessages`](api/classes/QueueDeadLetteredMessages.md) classes.

**Example 1: Enable Dead-Lettered Message Storage**

```typescript
const config: IRedisSMQConfig = {
  messages: {
    store: {
      deadLettered: true, // Store all dead-lettered messages indefinitely
    },
  },
};
```

**Example 2: Store All Acknowledged Messages, and Limit Dead-Lettered Messages to 100,000 with 1-Day Retention**

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

**Example 3: Limit Both Acknowledged and Dead-Lettered Messages to 5,000 with 1-Day Retention**

```typescript
const config: IRedisSMQConfig = {
  messages: {
    store: {
      acknowledged: {
        queueSize: 5000, // Store up to 5,000 acknowledged messages per queue
      },
      deadLettered: {
        queueSize: 5000, // Store up to 5,000 dead-lettered messages per queue
        expire: 24 * 60 * 60 * 1000, // Retain for 1 day (in milliseconds)
      },
    },
  },
};
```

#### Summary
- By default, only the main queue is persisted.
- To enable managing of acknowledged or dead-lettered messages via their dedicated classes, configure `messages.store` accordingly.
- Use the configuration examples above to tailor message retention to your application's needs.