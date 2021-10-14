# RedisSMQ - Yet another simple Redis message queue

[![Tests](https://github.com/weyoss/redis-smq/actions/workflows/tests.yml/badge.svg)](https://github.com/weyoss/redis-smq/actions/workflows/tests.yml)
[![Coverage Status](https://img.shields.io/coveralls/github/weyoss/redis-smq.svg)](https://coveralls.io/r/weyoss/redis-smq?branch=master)
[![NPM version](http://img.shields.io/npm/v/redis-smq.svg)](https://npmjs.org/package/redis-smq)
[![NPM downloads](https://img.shields.io/npm/dm/redis-smq.svg)](https://npmjs.org/package/redis-smq)
[![Code quality](https://img.shields.io/lgtm/grade/javascript/github/weyoss/redis-smq.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/weyoss/redis-smq/context:javascript)

A simple high-performance Redis message queue for Node.js.

For more details about RedisSMQ design see [https://medium.com/@weyoss/building-a-simple-message-queue-using-redis-server-and-node-js-964eda240a2a](https://medium.com/@weyoss/building-a-simple-message-queue-using-redis-server-and-node-js-964eda240a2a)

## Features

 * **[High-performance message processing](docs/performance.md)**
 * **Scalable**: A queue can be consumed by many concurrent consumers, running on the same or different hosts.
 * **Persistent**: No messages are lost in case of consumer failures.
 * **Atomic**: A message can be delivered only to one consumer at a time.
 * **[Message expiration](docs/api/message.md)**: A message will expire and not be consumed if it has been in the queue for longer than the
 TTL (time-to-live).
 * **[Message consume timeout](docs/api/message.md)**: The amount of time for a consumer to consume a message. If the timeout exceeded,
 message processing is cancelled and the message is re-queued again.
 * **[Delaying and scheduling message delivery](docs/api/scheduler.md)**: Messages can be configured to be delayed, delivered 
   for N times with an optional period between deliveries, and to be scheduled using CRON expressions.
 * **[Reliable Priority Queues](docs/priority-queues.md)**: Supports priority messaging.
 * **[HTTP API](docs/http-api.md)**: an HTTP interface is provided to interact with the MQ.
 * **[Web UI](docs/web-ui.md)**: The MQ state (input/processing/acks/unacks messages rates, online consumers, queues, etc.) is provided 
   and updated in real-time. The Web UI allows monitoring and managing the MQ.
 * **[JSON Logging](docs/logs.md)**: Supports JSON log format for troubleshooting and analytic purposes.
 * **Highly optimized**: No promises, no async/await, small memory footprint, no memory leaks. See [callbacks vs promises vs async/await benchmarks](http://bluebirdjs.com/docs/benchmarks.html).
 * **[Configurable](docs/configuration.md)**: Many options and features can be configured.
 * **Supports both redis & ioredis**: RedisSMQ can be configured to use either `redis` or `ioredis` 
 to connect to Redis server.  

## Table of content

1. [What's new?](#whats-new)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Usage](#usage)
   1. Basic
       1. [Message Class](#message-class)
       2. [Producer Class](#producer-class)
       3. [Consumer Class](#consumer-class)
   2. Advanced Topics
      1. [Message Scheduler](docs/api/scheduler.md)
      2. [Priority Queues](docs/priority-queues.md)
      3. [Message Manager](docs/api/message-manager.md)
      4. [Queue Manager](docs/api/queue-manager.md)
      5. [HTTP API](docs/http-api.md)
      6. [Web UI](docs/web-ui.md)
      7. [Logs](docs/logs.md)
5. [Performance](#performance)
6. [Contributing](#contributing)
7. [License](#license)

## What's new?

**2021.10.07**

- With the release of v3.3.0, reliable, persistent priority queues are now supported.

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

## Configuration

See [Configuration](docs/configuration.md) for more details.

## Usage

### Basics

RedisSMQ provides 3 classes: Message, Producer and Consumer in order to work with the message queue.

#### Message Class

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

See [Message Reference](docs/api/message.md) for more details.

#### Producer Class

Producer class is in turn responsible for producing messages. 

Each producer instance has an associated message queue and provides `produceMessage()` method which handle the
message and decides to either send it to the message queue scheduler or to immediately enqueue it for delivery.

```javascript
// filename: ./examples/javascript/ns1-test-queue-producer.js

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

See [Producer Reference](docs/api/producer.md) for more details.

#### Consumer Class

The Consumer class is the base class for all consumers. All consumers extends this base class and implements
`consume()` method which got called once a message is received.

Consumer classes are saved per files. Each consumer file represents a consumer class.

A consumer class may look like:

```javascript
// filename: ./examples/javascript/ns1-test-queue-consumer.js
'use strict';

const { Consumer } = require('redis-smq');

class TestQueueConsumer extends Consumer {
    consume(message, cb) {
        console.log('Got a message to consume:', message);
        cb();
    }
}

const consumer = new TestQueueConsumer('test_queue');
consumer.run();
```

To start consuming messages, a consumer needs first to be launched from CLI to connect to the Redis server 
and wait for messages: 

```text
$ node ./examples/javascript/test-queue-consumer.js
```

Once a message is received and processed the consumer should acknowledge the message by invoking the callback function
without arguments.

The message acknowledgment informs the MQ that the message has been successfully consumed.

If an error occurs, the message should be unacknowledged and the error should be reported to the MQ by
calling the callback function. Failed messages are re-queued and delivered again unless **message retry threshold** is
exceeded. Then the messages are moved to **dead-letter queue (DLQ)**. Each message queue has a system generated
corresponding queue called dead-letter queue where all failed messages are moved to.

See [Consumer Reference](docs/api/consumer.md) for more details.

### Advanced Topics

* [Scheduler](docs/api/scheduler.md)

* [Priority Queues](docs/priority-queues.md)
  
* [Message Manager](docs/api/message-manager.md)

* [Queue Manager](docs/api/queue-manager.md)

* [HTTP API](docs/http-api.md)

* [Web UI](docs/web-ui.md)

* [Logs](docs/logs.md)

## Performance

See [Performance](docs/performance.md) for more details.

## Contributing

So you are interested in contributing to this project? Please see [CONTRIBUTING.md](https://github.com/weyoss/guidelines/blob/master/CONTRIBUTIONS.md).

## License

[MIT](https://github.com/weyoss/redis-smq/blob/master/LICENSE)