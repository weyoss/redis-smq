# RedisSMQ - Yet another simple Redis message queue

[![CI](https://github.com/weyoss/redis-smq/actions/workflows/tests.yml/badge.svg)](https://github.com/weyoss/redis-smq/actions/workflows/tests.yml)
[![Coverage Status](https://coveralls.io/repos/weyoss/redis-smq/badge.svg?branch=ci)](https://coveralls.io/r/weyoss/redis-smq?branch=master)
[![Dependencies Status](https://david-dm.org/weyoss/redis-smq.svg)]((https://david-dm.org/weyoss/redis-smq))
[![NPM version](http://img.shields.io/npm/v/redis-smq.svg)](https://npmjs.org/package/redis-smq)
[![NPM downloads](https://img.shields.io/npm/dm/redis-smq.svg)](https://npmjs.org/package/redis-smq)
[![Code quality](https://img.shields.io/lgtm/grade/javascript/github/weyoss/redis-smq.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/weyoss/redis-smq/context:javascript)

A simple high-performance Redis message queue for Node.js.

For more details about RedisSMQ design see [https://medium.com/@weyoss/building-a-simple-message-queue-using-redis-server-and-node-js-964eda240a2a](https://medium.com/@weyoss/building-a-simple-message-queue-using-redis-server-and-node-js-964eda240a2a)

## Features

 * **Persistent**: No messages are lost in case of a consumer failure.
 * **Atomic**: A message is delivered only once to one consumer (in FIFO order) so you would never fall into a situation
 where a message could be processed more than once.
 * **High-performance message processing**: See [Performance](#performance) for more details.
 * **Scalable**: A queue can be consumed by many concurrent consumers, running on the same or on different hosts.
 * **Message expiration**: A message will expire and not be consumed if it has been in the queue for longer than the 
 TTL (time-to-live).
 * **Message consume timeout**: The amount of time for a consumer to consume a message. If the timeout exceeds,
 message processing is cancelled and the message is re-queued to be consumed again.
 * **Delaying and scheduling message delivery**: From version 1.0.19 a persistent scheduler has been built into 
 RedisSMQ message queue. The scheduler accepts delaying messages, repeated messages delivery, period
 between repeats and CRON expressions.
 * **Highly optimized**: No promises, no async/await, small memory footprint, no memory leaks. See [callbacks vs promises vs async/await benchmarks](http://bluebirdjs.com/docs/benchmarks.html).
 * **Monitorable**: Statistics (input/processing/acks/unacks messages rates, online consumers, queues, etc.)
   are provided in real-time.
 * **Logging**: Supports JSON log format for troubleshooting and analytics purposes.
 * **Configurable**: Many options and features can be configured.  
 * **Supports both redis & ioredis**: Starting from v1.1.0 RedisSMQ can be configured to use either `redis` or `ioredis` 
 to connect to Redis server.  

## Table of content

1. [What's new?](#whats-new)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Usage](#usage)
    1. [Message Class](#message-class)
    2. [Producer Class](#producer-class)
    3. [Consumer Class](#consumer-class)
    4. [Message Scheduler](#message-scheduler)
5. [Performance](#performance)
    1. [Scenarios](#scenarios)
    2. [Environment](#environment)
    3. [Results](#results)
6. [Troubleshooting and monitoring](#troubleshooting-and-monitoring)
    1. [Logs](#logs)
    2. [Monitoring](#monitoring)
7. [Contributing](#contributing)
8. [License](#license)

## What's new?

**2021.09.08**

- A major release v3 is out. 
- Upgrading your installation to the newest version should be straightforward as most APIs are compatible, [with some exceptions](docs/migrating-from-v2-to-v3.md).
- The project's code base has been migrated to TypeScript to make use of strong typings. 
- JavaScript's users are always first class citizens.

See [CHANGELOG](CHANGELOG.md) for more details.

## Installation

```text
npm install redis-smq --save
```

Considerations:

- RedisSMQ is targeted to be used in production environments. Therefore, only active LTS and maintenance LTS Node.js 
  releases (v12, v14, and v16) are supported. The latest stable Node.js version is recommended.
- Minimal Redis server version is 2.6.12.

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

- `log` *(Object): Optional.* Logging parameters.

- `log.enabled` *(Integer/Boolean): Optional.* Enable/disable logging. By default logging is disabled.

- `log.options` *(Object): Optional.* All valid Bunyan configuration options are accepted. Please look at the 
  [Bunyan Repository](https://github.com/trentm/node-bunyan) for more details.

- `monitor` *(Object): Optional.* RedisSMQ monitor parameters.

- `monitor.enabled` *(Boolean/Integer): Optional.* Enable/Disable the monitor. By default disabled.

- `monitor.host` *(String): Optional.* IP address of the monitor server. By default `0.0.0.0`.

- `monitor.port` *(Integer): Optional.* Port of the monitor server. By default `7210`.

## Usage

RedisSMQ provides 3 classes: Message, Producer and Consumer in order to work with the message queue. 

### Message Class

Message class is the main component responsible for creating and handling messages. It encapsulates and provides all
the required methods needed to construct and deal with messages.

```javascript

const { Message } = require('redis-smq');

const message = new Message();

message
    .setBody({hello: 'world'})
    .setTTL(3600000)
    .setScheduledDelay(10)
    .setScheduledRepeat(6)
    .setScheduledPeriod(60)
    .setScheduledCron('* 30 * * * *');

let messageTTL = message.getTTL();
```

See [Message API Reference](docs/api/message.md) for more details.


### Producer Class

Producer class is in turn responsible for producing messages. 

Each producer instance has an associated message queue and provides `produceMessage()` method which handle the
message and decides to either send it to the message queue scheduler or to immediately enqueue it for delivery.

```javascript
// filename: ./example/test-queue-producer.js

'use strict';
const { Message, Producer } = require('redis-smq');

const message = new Message();

message
    .setBody({hello: 'world'})
    .setTTL(3600000);

const producer = new Producer('test_queue');
producer.produceMessage(message, (err) => {
   if (err) console.log(err);
   else console.log('Successfully produced')
});
```

See [Producer API Reference](docs/api/producer.md) for more details.

### Consumer Class

The Consumer class is the base class for all consumers. All consumers extends this base class and implements
`consume()` method which got called once a message is received.

Consumer classes are saved per files. Each consumer file represents a consumer class.

A consumer class may look like:

```javascript
// filename: ./example/test-queue-consumer.js

'use strict';

const { Consumer } = require('redis-smq');

class TestQueueConsumer extends Consumer {
    /**
     *
     * @param message
     * @param cb
     */
    consume(message, cb) {
        //  console.log('Got a message to consume:', message);
        //  
        //  throw new Error('TEST!');
        //  
        //  cb(new Error('TEST!'));
        //  
        //  const timeout = parseInt(Math.random() * 100);
        //  setTimeout(() => {
        //      cb();
        //  }, timeout);
        cb();
    }
}

const consumer = new TestQueueConsumer('test_queue');
consumer.run();
```

To start consuming messages, a consumer needs first to be launched from CLI to connect to the Redis server 
and wait for messages: 

```text
$ node ./example/test-queue-consumer.js
```

Once a message is received and processed the consumer should acknowledge the message by invoking the callback function
without arguments.

The message acknowledgment informs the message queue that the message has been successfully consumed.

If an error occurs, the message should be unacknowledged and the error should be reported to the message queue by
calling the callback function. Failed messages are re-queued and delivered again unless **message retry threshold** is
exceeded. Then the messages are moved to **dead-letter queue (DLQ)**. Each message queue has a system generated
corresponding queue called dead-letter queue where all failed to consume messages are moved to.

See [Consumer API Reference](docs/api/consumer.md) for more details.

### Message Scheduler

Message Scheduler enables you to schedule a one-time or repeating messages in your MQ server.

The [Message API](docs/api/message.md) provides many methods:

- [setScheduledPeriod()](docs/api/message.md#messageprototypesetscheduledperiod) 
- [setScheduledDelay()](docs/api/message.md#messageprototypesetscheduleddelay) 
- [setScheduledCron()](docs/api/message.md#messageprototypesetscheduledcron)
- [setScheduledRepeat()](docs/api/message.md#messageprototypesetscheduledrepeat)

in order to set up scheduling parameters for a specific message. Once your message is ready, you can use 
[producer.produceMessage()](docs/api/producer.md#producerprototypeproducemessage) to publish it. 

Under the hood, the `producer` invokes `isSchedulable()` and `schedule()`  of the [Scheduler class](docs/api/scheduler.md) 
to place your message in the delay queue.

Alternatively, you can also manually get the scheduler instance from the producer using `producer.getScheduler()` 
and call the `schedule()` method as shown in the example bellow:

```javascript
'use strict';
const { Message, Producer } = require('redis-smq');

const message = new Message();

message
    .setBody({hello: 'world'})
    .setScheduledCron(`0 0 * * * *`);

const producer = new Producer('test_queue');
const scheduler = producer.getScheduler();

scheduler.schedule(message, (err, reply) => {
    if (err) console.log(err);
    else if (rely) console.log('Message has been succefully scheduled');
    else console.log('Message has not been scheduled');
});
```

See [Scheduler API Reference](docs/api/scheduler.md) for more details.

## Performance

One key indicator about how RedisSMQ is fast and performant is Message throughput. Message throughput is the number of
messages per second that the message queue can process. 

### Scenarios

We can measure the Producer throughput and the Consumer throughput. The benchmark is composed of:

1. Measuring Producer throughput (without consumers running at the same time)
2. Measuring Consumer throughput (without producers running at the same time)
3. Measuring throughput of Producer and Consumer both running at the same time

In all scenarios messages are produced and consumed as fast as possible.


### Environment

The benchmark was performed on a KVM virtual machine (4 CPU cores, 8GB RAM) hosted on a desktop computer 
(CPU AMD FX8350, RAM 32GB) running Debian 8. 

No performance tuning was performed for the VM, neither for Redis server. Default parameters were used out of box.

The virtual machine was setup to run a single instance of Redis (Redis is single threaded, so more instances can boost performance).

All consumers, producers, monitor and redis server are launched from the same host.

### Results

| Scenario                                             | Producer rate (msg/sec) | Consumer rate (msg/sec) |
|-----------------------------------------------------|-------------------------|-------------------------|
| Run 1 producer instance                             | 23K+                    | 0                       |
| Run 10 producer instances                           | 96K+                    | 0                       |
| Run 1 consumer instance                             | 0                       | 13K+                    |
| Run 10 consumer instances                           | 0                       | 49K+                    |
| Run 1 producer instance and 1 consumer instance     | 22K+                    | 12K+                    |
| Run 10 producer instances and 10 consumer instances | 45K+                    | 27K+                    |
| Run 10 producer instances and 20 consumer instances | 32K+                    | 32K+                    |

## Troubleshooting and monitoring

### Logs

This package is using JSON log format, thanks to [Bunyan](https://github.com/trentm/node-bunyan).

The structured data format of JSON allows analytics tools to take place but also helps to monitor and troubleshoot 
issues easier and faster.

By default all logs are disabled. Logging can affect performance (due to I/O operations). When enabled you can 
use bunyan utility to pretty format the output.

Unless configured otherwise, the standard output is the console which launched the consumer.

```text
$ node consumer | ./node_modules/.bin/bunyan
```
### Monitoring

The RedisSMQ Monitor is an interface which let you monitor and debug your RedisSMQ server from a web browser in 
real-time.

Starting from version v1.1.0, RedisSMQ Monitor has split up into a standalone project and was packaged under
[RedisSMQ Monitor](https://github.com/weyoss/redis-smq-monitor)

RedisSMQ includes the monitor as part of its package.

```javascript
// filename: ./example/monitor.js
'use strict';

const config = require('./config');
const { monitor } = require('redis-smq');

monitor(config).listen(() => {
    console.log('It works!')
});
```
## Contributing

So you are interested in contributing to this project? Please see [CONTRIBUTING.md](https://github.com/weyoss/guidelines/blob/master/CONTRIBUTIONS.md).

## License

[MIT](https://github.com/weyoss/redis-smq/blob/master/LICENSE)