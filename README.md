[![RedisSMQ](./logo.png)](https://github.com/weyoss/redis-smq)

A High-Performance Redis Simple Message Queue for Node.js

[![Build](https://img.shields.io/github/actions/workflow/status/weyoss/redis-smq/tests.yml?style=flat-square)](https://github.com/weyoss/redis-smq/actions/workflows/tests.yml)
[![Code Quality](https://img.shields.io/github/actions/workflow/status/weyoss/redis-smq/codeql.yml?style=flat-square&label=quality)](https://github.com/weyoss/redis-smq/actions/workflows/codeql.yml)
[![Code Coverage](https://img.shields.io/codecov/c/github/weyoss/redis-smq?style=flat-square)](https://codecov.io/github/weyoss/redis-smq?branch=master)
[![Latest Release](https://img.shields.io/github/v/release/weyoss/redis-smq?include_prereleases&label=release&color=green&style=flat-square)](https://github.com/weyoss/redis-smq/releases)
![Downloads](https://img.shields.io/npm/dm/redis-smq.svg?style=flat-square)

**Key Features**

*   [High-performance message processing](docs/performance.md)
*   [Flexible producer/consumer model with multi-queue producers and consumers](docs/consuming-messages.md)
*   [Different exchange types (Direct, Topic, FanOut) for publishing messages to one or multiple queues](docs/message-exchanges.md)
*   [Two delivery models (Point-2-Point and Pub/Sub)](docs/queue-delivery-models.md) with reliable delivery and configurable retry modes
*   [Three queuing strategies (FIFO, LIFO, Priority Queues)](docs/queues.md)
*   [Message handler worker threads for sandboxing and performance improvement](docs/message-handler-worker-threads.md)
*   [Message expiration and consumption timeout](docs/messages.md)
*   [Queue rate limiting for controlling message consumption rates](docs/queue-rate-limiting.md)
*   [Built-in scheduler for delayed message delivery and repeating messages](docs/scheduling-messages.md)
*   [RESTful API](https://github.com/weyoss/redis-smq-rest-api) and web UI for interacting with the message queue
*   [Support for ESM and CJS modules](docs/esm-cjs-modules.md)

**Use Cases**

- Managing background tasks, such as email sending or data processing.
- Efficiently scheduling and retrying tasks.
- Communication between multiple services in microservices architectures.
- Handling real-time events in gaming, IoT, or analytics systems.

**Installation and Usage**

To get started with RedisSMQ, you can install the library using npm:
```bash
npm i redis-smq@rc
```
Create a queue, produce a message, and consume it using the provided classes and methods:
```javascript
// Creating a queue
const queue = new Queue();
queue.save('my_queue', EQueueType.LIFO_QUEUE, EQueueDeliveryModel.POINT_TO_POINT, (err) => {
    if (err) console.error(err);
});

// Producing a message
const msg = new ProducibleMessage();
msg.setQueue('my_queue').setBody('Hello Word!');
producer.produce(msg, (err, ids) => {
    if (err) console.error(err);
    else console.log(`Produced message IDs are: ${ids.join(', ')}`);
});

// Consuming a message
const consumer = new Consumer();
const messageHandler = (msg, cb) => {
    console.log(msg.body);
    cb(); // Acknowledging
};
consumer.consume('my_queue', messageHandler, (err) => {
    if (err) console.error(err);
});
```
**Documentation**

For more information, visit the [RedisSMQ Docs](docs/README.md).

**Contributing**

Interested in contributing to this project? Please check out our [CONTRIBUTING.md](https://github.com/weyoss/guidelines/blob/master/CONTRIBUTIONS.md).

**License**

RedisSMQ is released under the [MIT License](https://github.com/weyoss/redis-smq/blob/master/LICENSE).