<div align="center" style="text-align: center">
  <p><a href="https://github.com/weyoss/redis-smq"><img alt="RedisSMQ" src="./logo.png" /></a></p>
  <p>A simple high-performance Redis message queue for Node.js.</p>
  <p>
    <a href="https://github.com/weyoss/redis-smq/actions/workflows/tests.yml"><img src="https://github.com/weyoss/redis-smq/actions/workflows/tests.yml/badge.svg" alt="Tests" style="max-width:100%;" /></a>
    <a href="https://coveralls.io/r/weyoss/redis-smq?branch=master" rel="nofollow"><img src="https://img.shields.io/coveralls/github/weyoss/redis-smq.svg" alt="Coverage Status" /></a>
    <a href="https://npmjs.org/package/redis-smq" rel="nofollow"><img src="https://img.shields.io/npm/v/redis-smq.svg" alt="NPM version" /></a>
    <a href="https://npmjs.org/package/redis-smq" rel="nofollow"><img src="https://img.shields.io/npm/dm/redis-smq.svg" alt="NPM downloads" /></a>
    <a href="https://lgtm.com/projects/g/weyoss/redis-smq/context:javascript" rel="nofollow"><img src="https://img.shields.io/lgtm/grade/javascript/github/weyoss/redis-smq.svg?logo=lgtm&logoWidth=18" alt="Code quality" /></a>
  </p>
</div>

RedisSMQ is a Node.js library for queuing messages (aka jobs) and processing them asynchronously with consumers. Backed by Redis, it allows scaling up your application with ease of use.

## Features

* **[High-performance message processing](docs/performance.md)**
* **[Multi-Queue Producers](#producer-class) & [Multi-Queue Consumers](#consumer-class)**: Offering very flexible models which make RedisSMQ an ideal message broker for your microservices. 
* **Scalable**: You can run multiple Consumer/Producer instances concurrently in the same host, or in different hosts.
* **Supporting both [at-least-once/at-most-once delivery](/docs/api/message.md#messageprototypesetretrythreshold)**: In case of failures, while delivering or processing a message, RedisSMQ can guaranty that the message will be not lost and redelivered again. When configured to do so, RedisSMQ can ensure that the message is delivered at-most-once.
* **[Message expiration](docs/api/message.md#messageprototypesetttl)**: A message will not be delivered if it has been in a queue for longer than a given amount of time, called TTL (time-to-live).
* **[Message consume timeout](docs/api/message.md#messageprototypesetconsumetimeout)**: Timeout for consuming messages.
* **[Delaying and scheduling message delivery](docs/scheduling-messages.md)**: Messages can be configured to be delayed, delivered for N times with an optional period between deliveries, and to be scheduled using CRON expressions.
* **[Reliable Priority Queues](docs/priority-queues.md)**: Supports priority messaging.
* **[HTTP API](docs/http-api.md)**: an HTTP interface is provided to interact with the MQ.
* **[Web UI](docs/web-ui.md)**: RedisSMQ can be managed also from your web browser.
* **[Logging](docs/logs.md)**: Comes with a built-in JSON logger. But you can also use your own logger instance.
* **Highly optimized**: Strongly-typed and implemented using pure callbacks, with small memory footprint and no memory leaks. See [callbacks vs promises vs async/await benchmarks](http://bluebirdjs.com/docs/benchmarks.html).
* **[Configurable](docs/configuration.md)**: Many options and features can be configured.
* **Rigorously tested**: With 100+ tests and code coverage no less than 80%.
* **Supports both redis & ioredis**: RedisSMQ can be configured to use either `redis` or `ioredis` to connect to Redis server.

### RedisSMQ Use Case: Multi-Queue Producers & Multi-Queue Consumers

&nbsp;

![RedisSMQ Overview](docs/redis-smq-overview.png)

## Table of Content

1. [What's new?](#whats-new)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Usage](#usage)
   1. Basics
       1. [Message Class](#message-class)
       2. [Producer Class](#producer-class)
       3. [Consumer Class](#consumer-class)
   2. Advanced Topics
      1. [Scheduling Messages](docs/scheduling-messages.md)
      2. [Priority Queues](docs/priority-queues.md)
      3. [Message Manager](docs/api/message-manager.md)
      4. [Queue Manager](docs/api/queue-manager.md)
      5. [HTTP API](docs/http-api.md)
      6. [Web UI](docs/web-ui.md)
      7. [Logs](docs/logs.md)
5. [RedisSMQ Architecture](docs/redis-smq-architecture.md)
6. [Performance](#performance)
7. [Contributing](#contributing)
8. [License](#license)

## What's new?

**2022.02.08**

- :rocket: Release v6 is finally ready. This release includes new features such as multi-queue consumers and multi-queue producers, message rate time series, complete integration with the Web UI, as well as many improvements and bug fixes. If you are upgrading your installation, take a look at the [migration guide](docs/migrating-from-v5-to-v6.md) before proceeding.

See [CHANGELOG](CHANGELOG.md) for more details.

## Installation

```text
npm install redis-smq --save
```

Considerations:

- RedisSMQ is targeted to be used in production environments. Therefore, only active LTS and maintenance LTS Node.js releases (v12, v14, and v16) are supported. The latest stable Node.js version is recommended.
- Minimal Redis server version is 2.6.12. The latest stable Redis version is recommended.

## Configuration

See [Configuration](docs/configuration.md) for more details.

## Usage

### Basics

RedisSMQ provides 3 classes: `Message`, `Producer`, and `Consumer` in order to work with the message queue.

#### Message Class

`Message` class is responsible for creating and manipulating messages.

```javascript
const { Message } = require('redis-smq');
const message = new Message();
message
    .setBody({hello: 'world'})
    .setTTL(3600000) // in millis
    .setQueue('test_queue');

let messageTTL = message.getTTL();
```

See [Message Reference](docs/api/message.md) for more details.

#### Producer Class

`Producer` class is in turn responsible for publishing messages. 

You can use the same producer instance for publishing messages to multiple queues. The same producer instance can also produce messages with priority. 

```javascript
// filename: ./examples/javascript/producer.js

'use strict';
const {Message, Producer} = require('redis-smq');

const message = new Message();

message
    .setBody({hello: 'world'})
    .setTTL(3600000)
    .setQueue('test_queue');

message.getId() // null

const producer = new Producer();
producer.produce(message, (err) => {
    if (err) console.log(err);
    else {
      const msgId = message.getId(); // string
      console.log('Successfully produced. Message ID is ', msgId);
    }
});
```

See [Producer Reference](docs/api/producer.md) for more details.

#### Consumer Class

In the same manner as a producer, you can use a single consumer instance to consume messages from different queues, including messages from priority queues.

To consume messages from a given queue, you need to define and register a `message handler`. 

A `message handler` is a function which get called once a message is received. For a given consumer, a queue can have only 2 message handlers. One for consuming messages without priority, and the second one for consuming messages with priority.

To register a message handler, the `consume()` method is provided and can be used as shown in the example bellow. Message handlers can be registered at any time, before or after you have started your consumers. A consumer can be started using the `consumer.run()` method.

To shut down and remove a `message handler` from your consumer, use the `cancel()` method. 

To shut down completely your consumer, use the `shutdown()` method.


```javascript
// filename: ./examples/javascript/consumer.js
'use strict';

const { Consumer } = require('redis-smq');

const consumer = new Consumer();

consumer.consume('test_queue', false, (msg, cb) => {
  const payload = msg.getBody();
  console.log('Message payload', payload);
  cb(); // acknowledging the message
});

consumer.consume('another_queue', true, (msg, cb) => {
   const payload = msg.getBody();
   console.log('Message payload', payload);
   cb(); // acknowledging the message
});

consumer.run();
```

From your `message handler`, when you receive a message, in order to acknowledge it, you can invoke the callback function, without arguments as shown the example above. 

Message acknowledgment informs the MQ that a given message has been successfully consumed.

If an error occurred while processing a message, you can unacknowledge it by passing the error to the callback function.

By default, unacknowledged messages are re-queued and delivered again unless **message retry threshold** is exceeded. Then the messages are moved to **dead-letter queue (DLQ)**. 

A `dead-letter queue` is a system generated queue that holds all messages that couldn't be processed or can not be delivered to consumers.

By default, RedisSMQ does not store acknowledged and dead-lettered messages for saving disk and memory space, and also to increase message processing performance. If you need such feature, you can enable it from your [configuration](/docs/configuration.md) object.

See [Consumer Reference](docs/api/consumer.md) for more details.

### Advanced Topics

* [Scheduling Messages](docs/scheduling-messages.md)

* [Priority Queues](docs/priority-queues.md)
  
* [Message Manager](docs/api/message-manager.md)

* [Queue Manager](docs/api/queue-manager.md)

* [HTTP API](docs/http-api.md)

* [Web UI](docs/web-ui.md)

* [Logs](docs/logs.md)

## RedisSMQ Architecture

* See [Architecture Overview](docs/redis-smq-architecture.md).

## Performance

See [Performance](docs/performance.md) for more details.

## Contributing

So you are interested in contributing to this project? Please see [CONTRIBUTING.md](https://github.com/weyoss/guidelines/blob/master/CONTRIBUTIONS.md).

## License

[MIT](https://github.com/weyoss/redis-smq/blob/master/LICENSE)
