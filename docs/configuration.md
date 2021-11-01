# Configuration

Before running a Producer or a Consumer instance, an object containing the configuration parameters can be supplied
to the class constructor in order to configure the message queue.

A configuration object may look like:

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
    log: {
        enabled: 0,
        options: {
            level: 'trace',
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
    priorityQueue: false,
    message: {
        consumeTimeout: 60000,
        retryThreshold: 5,
        retryDelay: 60000,
        ttl: 120000,
    }
};
```

**Parameters**

- `namespace` *(String): Optional.* The namespace for message queues. It can be composed only of letters (a-z),
  numbers (0-9) and (-_) characters. Namespace can be for example configured per project.

- `redis` *(Object): Optional.* Redis client parameters. If not provided the `redis` client would be used by default.

- `redis.client` *(String): Optional.* Redis client name. Can be either `redis` or `ioredis`.

- `redis.options` *(Object): Optional.* Redis client options.
   - See https://github.com/NodeRedis/node_redis#options-object-properties for all valid parameters for `redis` client.
   - See https://github.com/luin/ioredis/blob/master/API.md#new_Redis for all valid `ioredis` parameters.

- `log` *(Object): Optional.* See [Logs Configuration](logs.md#configuration) for more details.

- `monitor` *(Object): Optional.* See [Web UI Configuration](web-ui.md#configuration) for more details.

- `priorityQueue` *(Boolean): Optional.*  See [Priority Queues Configuration](priority-queues.md#configuration) for more details.

- `message` *(object): Optional.* Default message parameters. These parameters can be overwritten for a given message instance. 
  See [Message API](api/message.md) for more details. 
  - `message.consumeTimeout` *(Integer): Optional.* In milliseconds. Also called job timeout, is the amount of time in
    milliseconds before a consumer consuming a message times out. If the consumer does not consume the message
    within the set time limit, the message consumption is automatically canceled and the message is re-queued
    to be consumed again. By default, message consumption timeout is not set.
  - `message.ttl` *(Integer): Optional.* In milliseconds. All queue messages are guaranteed to not be consumed and destroyed if
     they have been in the queue for longer than an amount of time called TTL (time-to-live). By default, message TTL is not set.
  - `message.retryThreshold` *(Integer): Optional.* The number of times the message can be enqueued and delivered again.
     Can be defined per message instance or per consumer. By default, message retry threshold is set to 3.
  - `message.retryDelay` *(Integer): Optional.* In seconds. The amount of time in seconds to wait for before
     re-queuing a failed message. By default, message retry delay is 60 seconds.