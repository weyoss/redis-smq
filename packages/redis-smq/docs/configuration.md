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

By default, published messages in a queue are stored until they are explicitly deleted. The `messages.store` option
allows you to manage how acknowledged and dead-lettered messages are stored across all message queues.

#### Default Behavior

Acknowledged and dead-lettered messages are not stored by default.

#### Message Storage Configuration Examples

##### 1. Only Storing Dead-Lettered Messages:

```typescript
const config: IRedisSMQConfig = {
  messages: {
    store: {
      deadLettered: true,
    },
  },
};
```

#### 2. Storing Acknowledged Messages Without Limitation, and 100,000 Dead-Lettered Messages with a Maximum Retention Time of 1 Day:

```typescript
const config: IRedisSMQConfig = {
  messages: {
    store: {
      acknowledged: true,
      deadLettered: {
        queueSize: 100000,
        expire: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      },
    },
  },
};
```

#### 3. Storing Acknowledged Messages Up to 5,000, and Maximum 5,000 Dead-Lettered Messages with a Retention Time of 1 Day:

```typescript
const config: IRedisSMQConfig = {
  messages: {
    store: {
      acknowledged: {
        queueSize: 5000,
      },
      deadLettered: {
        queueSize: 5000,
        expire: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      },
    },
  },
};
```
