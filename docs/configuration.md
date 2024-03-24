[RedisSMQ](../README.md) / [Docs](README.md) / Configuration

# Configuration

RedisSMQ configuration is a one-time setup that takes place, usually, during your application initialization and before using any exported class or function from the library.

To set up the message queue RedisSMQ provides a singleton class that may be used as shown bellow:

```javascript
'use strict';
const { Configuration, ERedisConfigClient } = require('redis-smq');

const config = {
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

See [Configuration Reference](api/classes/Configuration.md) for more details.

## Configuration parameters

See [IRedisSMQConfig Interface](api/interfaces/IRedisSMQConfig.md) for more details.

**Configuration Example**

```javascript
'use strict';
const { ERedisConfigClient } = require('redis-smq');

module.exports = {
  namespace: 'my_project_name',
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
      connect_timeout: 3600000,
    },
  },
  logger: {
    enabled: true,
    options: {
      level: 'info',
      /*
            streams: [
                {
                    path: path.normalize(`${__dirname}/../logs/redis-smq.log`)
                },
            ],
            */
    },
  },
  messages: {
    store: false,
  },
  eventBus: {
    enabled: false,
  }
};
```

#### Message Storage

Published messages, to a queue, are permanently stored unless deleted explicitly.

The `message.store` option allows, additionally, to configure acknowledged/dead-lettered messages storage for all message queues.

In other words, when `message.store` is enabled, a queue, in addition to all published messages, may hold a list of all dead-lettered messages for example.

By default acknowledged and dead-lettered messages are not stored.

**messages.store Usage Examples**

- Only storing dead-lettered messages:

```javascript
const config = {
  messages: {
    store: {
      deadLettered: true,
    },
  },
};
```

- Storing acknowledged messages without any limitation, and storing 100000 dead-lettered messages for a maximum retention time of 1 day:

```javascript
const config = {
  messages: {
    store: {
      acknowledged: true,
      deadLettered: {
        queueSize: 100000,
        expire: 24 * 60 * 60 * 1000, // 1 day in millis
      },
    },
  },
};
```

- Storing acknowledged messages up to 5000 messages, and storing a maximum of 5000 dead-lettered messages with a retention time of 1 day:

```javascript
const config = {
  messages: {
    store: {
      acknowledged: {
        queueSize: 5000,
      },
      deadLettered: {
        queueSize: 5000,
        expire: 24 * 60 * 60 * 1000,
      },
    },
  },
};
```
