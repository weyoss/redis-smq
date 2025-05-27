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

For more detailed information, please refer to the [Configuration Class](api/classes/Configuration.md).

## Configuration parameters

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

For an in-depth understanding of configuration options, see [IRedisSMQConfig Interface](api/interfaces/IRedisSMQConfig.md).
