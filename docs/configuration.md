# Configuration

```javascript
// filename: ./examples/javascript/consumer.js
'use strict';
const config = require('./config');
const { Consumer, setConfiguration } = require('redis-smq');

// Applying system-wide configuration
// This setup should be done during your application bootstrap
// Throws an error if the configuration has been already set up
setConfiguration(config);

// ...
```

You can configure many of RedisSMQ features using a configuration object that you can pass to `setConfiguration()` method from the main package, before starting and using any component.

RedisSMQ accepts a one-time configuration setup which can take place, usually, during your application bootstrap. 

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
    monitor: {
        enabled: true,
        host: '127.0.0.1',
        port: 3000,
    },
    message: {
        consumeTimeout: 60000,
        retryThreshold: 5,
        retryDelay: 60000,
        ttl: 120000,
    },
    storeMessages: false,
};
```

**Parameters**

- `namespace` *(string): Optional.* The namespace for message queues. It can be composed only of letters (a-z),
  numbers (0-9) and (-_) characters. Namespace can be for example configured per project.

- `redis` *(object): Optional.* Redis client parameters. If not provided the `redis` client would be used by default.

- `redis.client` *(string): Optional.* Redis client name. Can be either `redis` or `ioredis`.

- `redis.options` *(object): Optional.* Redis client options.
   - See https://github.com/NodeRedis/node_redis#options-object-properties for all valid parameters for `redis` client.
   - See https://github.com/luin/ioredis/blob/master/API.md#new_Redis for all valid `ioredis` parameters.

- `logger` *(object): Optional.* See [Logs Configuration](logs.md#configuration) for more details.

- `monitor` *(object): Optional.* See [Web UI Configuration](web-ui.md#configuration) for more details.

- `message` *(object): Optional.* Default message parameters. These parameters can be overwritten for a given message 
instance using the [Message API](api/message.md). 
  - `message.consumeTimeout` *(Integer): Optional.* In milliseconds. Message consumption timeout. See [setConsumeTimeout()](/docs/api/message.md#messageprototypesetconsumetimeout).
  - `message.ttl` *(Integer): Optional.* In milliseconds. Message TTL. See [setTTL()](/docs/api/message.md#messageprototypesetttl).
  - `message.retryThreshold` *(Integer): Optional.* Message retry threshold. See [setRetryThreshold()](/docs/api/message.md#messageprototypesetretrythreshold).
  - `message.retryDelay` *(Integer): Optional.* In milliseconds. Message retry delay. See [setRetryDelay()](/docs/api/message.md#messageprototypesetretrydelay).

- `storeMessages` *(boolean | object): Optional.* Whether to store acknowledged and/or dead-lettered messages. By default, acknowledged and dead-lettered messages are not stored. Keep in mind that storing messages affects performance.
  - `storeMessages` *(boolean)*
    - `storeMessages = false` - Do not store acknowledged and dead-lettered messages. 
    - `storeMessages = true` - Store acknowledged and dead-lettered messages.
  - `storeMessages` *(object)*
    - `storeMessages.acknowledged` *(boolean | object): Optional.*
      - `storeMessages.acknowledged` *(boolean)*
        - `storeMessages.acknowledged = true`: Store acknowledged messages.
        - `storeMessages.acknowledged = false`: Do not store acknowledged messages.
      - `storeMessages.acknowledged` *(object)*
        - `storeMessages.acknowledged.queueSize` *(number): Optional.* Store a maximum of N acknowledged messages. Older messages get deleted when the maximum size is reached.
        - `storeMessages.acknowledged.expire` *(number): Optional.* Store acknowledged messages for N milliseconds. Each time a new message is saved the expiration is updated.
    - `storeMessages.deadLettered` *(boolean | object): Optional.*
      - `storeMessages.deadLettered` *(boolean)*
        - `storeMessages.deadLettered = true`: Store dead-lettered messages.
        - `storeMessages.deadLettered = false`: Do not store dead-lettered messages.
      - `storeMessages.deadLettered` *(object)*
        - `storeMessages.deadLettered.queueSize` *(number): Optional.* Store a maximum of N dead-lettered messages. Older messages get deleted when the maximum size is reached.
        - `storeMessages.deadLettered.expire` *(number): Optional.* Store dead-lettered messages for N milliseconds. Each time a new message is saved the expiration is updated.

  
**storeMessages Usage Examples**

- Only storing dead-lettered messages:

```javascript
const config = {
  storeMessages: {
    deadLettered: true,
  }
}
```

- Storing acknowledged messages without any limitation, and storing 100000 dead-lettered messages for a maximum retention time of 1 day:

```javascript
const config = {
  storeMessages: {
    acknowledged: true,
    deadLettered: {
      queueSize: 100000,
      expire: 24 * 60 * 60 * 1000 // 1 day in millis
    },
  }
}
```

- Storing acknowledged messages up to 5000 messages, and storing a maximum of 5000 dead-lettered messages with a retention time of 1 day:

```javascript
const config = {
  storeMessages: {
    acknowledged: {
      queueSize: 5000,
    },
    deadLettered: {
      queueSize: 5000,
      expire: 24 * 60 * 60 * 1000
    },
  }
}
```