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

- `namespace` *(string): Optional.* The namespace for message queues. It can be composed only of letters (a-z),
  numbers (0-9) and (-_) characters. Namespace can be for example configured per project.

- `redis` *(object): Optional.* See [Redis Configuration](https://github.com/weyoss/redis-smq-common/blob/master/docs/redis.md) for more details.

- `logger` *(object): Optional.* See [Logs Configuration](https://github.com/weyoss/redis-smq-common/blob/master/docs/logs.md) for more details.

- `messages` *(object): Optional.* Message options
  - `messages.store` *(boolean | object): Optional.* Whether to store acknowledged and/or dead-lettered messages. By default, acknowledged and dead-lettered messages are not stored. Keep in mind that storing messages affects performance.
    - `messages.store` *(boolean)*
      - `messages.store = false` - Do not store acknowledged and dead-lettered messages. 
      - `messages.store = true` - Store acknowledged and dead-lettered messages.
    - `messages.store` *(object)*
      - `messages.store.acknowledged` *(boolean | object): Optional.*
        - `messages.store.acknowledged` *(boolean)*
          - `messages.store.acknowledged = true`: Store acknowledged messages.
          - `messages.store.acknowledged = false`: Do not store acknowledged messages.
        - `messages.store.acknowledged` *(object)*
          - `messages.store.acknowledged.queueSize` *(number): Optional.* Store a maximum of N acknowledged messages. Older messages get deleted when the maximum size is reached.
          - `messages.store.acknowledged.expire` *(number): Optional.* Store acknowledged messages for N milliseconds. Each time a new message is saved the expiration is updated.
      - `messages.store.deadLettered` *(boolean | object): Optional.*
        - `messages.store.deadLettered` *(boolean)*
          - `messages.store.deadLettered = true`: Store dead-lettered messages.
          - `messages.store.deadLettered = false`: Do not store dead-lettered messages.
        - `messages.store.deadLettered` *(object)*
          - `messages.store.deadLettered.queueSize` *(number): Optional.* Store a maximum of N dead-lettered messages. Older messages get deleted when the maximum size is reached.
          - `messages.store.deadLettered.expire` *(number): Optional.* Store dead-lettered messages for N milliseconds. Each time a new message is saved the expiration is updated.

  
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