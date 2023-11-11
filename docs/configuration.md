[RedisSMQ](../README.md) / [Docs](README.md) / Configuration


# Configuration

You can configure many of RedisSMQ features using a config object that you can pass in to a configurable component (for example a Consumer constructor).

## Configuration parameters

**Configuration Example**

```javascript
'use strict';
const path = require('path');

module.exports = {
    namespace: 'my_project_name',
    redis: {
        client: 'redis',
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
    
};
```

**Parameters**

See [IRedisSMQConfig Interface](api/interfaces/IRedisSMQConfig.md) for more details.
  
**messages.store Usage Examples**

- Only storing dead-lettered messages:

```javascript
const config = {
  messages: {
    store: {
      deadLettered: true,
    }
  }
}
```

- Storing acknowledged messages without any limitation, and storing 100000 dead-lettered messages for a maximum retention time of 1 day:

```javascript
const config = {
  messages: {
    store: {
      acknowledged: true,
      deadLettered: {
        queueSize: 100000,
        expire: 24 * 60 * 60 * 1000 // 1 day in millis
      },
    }
  }
}
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
        expire: 24 * 60 * 60 * 1000
      },
    }
  }
}
```