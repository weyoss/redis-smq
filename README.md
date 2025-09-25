[![RedisSMQ](./logo.png)](https://github.com/weyoss/redis-smq)

A High-Performance Redis Simple Message Queue for Node.js

[![Build](https://img.shields.io/github/actions/workflow/status/weyoss/redis-smq/tests.yml?style=flat-square)](https://github.com/weyoss/redis-smq/actions/workflows/tests.yml)
[![Code Quality](https://img.shields.io/github/actions/workflow/status/weyoss/redis-smq/codeql.yml?style=flat-square&label=quality)](https://github.com/weyoss/redis-smq/actions/workflows/codeql.yml)
[![Latest Release](https://img.shields.io/github/v/release/weyoss/redis-smq?include_prereleases&label=release&color=green&style=flat-square)](https://github.com/weyoss/redis-smq/releases)
![Downloads](https://img.shields.io/npm/dm/redis-smq.svg?style=flat-square)

**What's New**

- 05.09.2025: V9 is coming soon — a focused refinement of V8. It brings end-to-end message observability, a more robust and
  efficient message storage layer, and a new Web UI for managing queues.

- 13.04.2025: V8 is here! Major architecture improvements, Pub/Sub delivery model, worker threads, enhanced TypeScript support, and more. [See release notes](release-notes/release-v8.md).


**Key Features**

- 🚀 [High-performance message processing](packages/redis-smq/docs/performance.md)
- 🔄 [Flexible producer/consumer model with multi-queue producers and consumers](packages/redis-smq/docs/consuming-messages.md)
- 🔀 [Different exchange types (Direct, Topic, FanOut) for publishing messages to one or multiple queues](packages/redis-smq/docs/message-exchanges.md)
- 📬 [Two delivery models (Point-2-Point and Pub/Sub)](packages/redis-smq/docs/queue-delivery-models.md) with reliable delivery and configurable retry modes
- 📊 [Three queuing strategies (FIFO, LIFO, Priority Queues)](packages/redis-smq/docs/queues.md)
- 🧵 [Message handler worker threads for sandboxing and performance improvement](packages/redis-smq/docs/message-handler-worker-threads.md)
- ⏱️ [Message expiration and consumption timeout](packages/redis-smq/docs/messages.md)
- 🚦 [Queue rate limiting for controlling message consumption rates](packages/redis-smq/docs/queue-rate-limiting.md)
- 🕰️ [Built-in scheduler for delayed message delivery and repeating messages](packages/redis-smq/docs/scheduling-messages.md)
- 🌐 [RESTful API](packages/redis-smq-rest-api/README.md) and [Web UI](packages/redis-smq-web-ui/README.md) for interacting with the message queue
- 📦 [Support for ESM and CJS modules](packages/redis-smq/docs/esm-cjs-modules.md)

**Use Cases**

- Managing background tasks, such as email sending or data processing.
- Efficiently scheduling and retrying tasks.
- Communication between multiple services in microservices architectures.
- Handling real-time events in gaming, IoT, or analytics systems.

**Installation**

To get started with RedisSMQ, you can install core packages using npm:

```bash
npm i redis-smq@latest redis-smq-common@latest --save
```

Don't forget to install a Redis client. Choose either node-redis or ioredis:

```shell
npm install @redis/client --save
# or
npm install ioredis --save
```

**Ecosystem**

| Package                                                         | Description                                                                          |
|-----------------------------------------------------------------|--------------------------------------------------------------------------------------|
| [redis-smq](packages/redis-smq/README.md)                       | A high-performance, reliable, and scalable message queue for Node.js.                |
| [redis-smq-common](packages/redis-smq-common/README.md)         | Provides essential components and utilities shared across RedisSMQ packages.         |
| [redis-smq-rest-api](packages/redis-smq-rest-api/README.md)     | A RESTful API for interacting with RedisSMQ, with OpenAPI v3 and Swagger UI.         |
| [redis-smq-web-server](packages/redis-smq-web-server/README.md) | A web server for the RedisSMQ Web UI, handling static assets, routing, and proxying. |
| [redis-smq-web-ui](packages/redis-smq-web-ui/README.md)         | A Single Page Application (SPA) for monitoring and managing RedisSMQ.                |

**Version compatibility**

Always install matching versions of RedisSMQ packages. See [Version Compatibility](packages/redis-smq/docs/version-compatibility.md).

**Configuration**

Set up the RedisSMQ configuration during your application bootstrap:

```javascript
'use strict';
const { Configuration } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

const config = {
  redis: {
    // Using ioredis as the Redis client
    client: ERedisConfigClient.IOREDIS,
    // Add any other ioredis options here
    options: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
};

Configuration.getSetConfig(config);
```

**Usage**

Here's a basic example to create a queue, produce a message, and consume it:

```javascript
// Creating a queue
const queueManager = new QueueManager();
queueManager.save('my_queue', EQueueType.LIFO_QUEUE, EQueueDeliveryModel.POINT_TO_POINT, (err) => {
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

For more information, visit the [RedisSMQ Docs](packages/redis-smq/docs/README.md).

**Contributing**

Interested in contributing to this project? Please check out our [CONTRIBUTING.md](CONTRIBUTING.md).

**License**

RedisSMQ is released under the [MIT License](https://github.com/weyoss/redis-smq/blob/master/LICENSE).
