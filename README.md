[![RedisSMQ](./logo.png)](https://github.com/weyoss/redis-smq)

A High-Performance Redis Simple Message Queue for Node.js

[![Build](https://img.shields.io/github/actions/workflow/status/weyoss/redis-smq/tests.yml?style=flat-square)](https://github.com/weyoss/redis-smq/actions/workflows/tests.yml)
[![Code Quality](https://img.shields.io/github/actions/workflow/status/weyoss/redis-smq/codeql.yml?style=flat-square&label=quality)](https://github.com/weyoss/redis-smq/actions/workflows/codeql.yml)
[![Latest Release](https://img.shields.io/github/v/release/weyoss/redis-smq?include_prereleases&label=release&color=green&style=flat-square)](https://github.com/weyoss/redis-smq/releases)
![Downloads](https://img.shields.io/npm/dm/redis-smq.svg?style=flat-square)

**Key Features**

- 🚀 [High-performance message processing](packages/redis-smq/docs/performance.md)
- 🔄 [Flexible producer/consumer model with multi-queue producers and consumers](packages/redis-smq/docs/consuming-messages.md)
- 🔀 [Exchange types (Direct, Topic, Fanout) for publishing to one or multiple queues](packages/redis-smq/docs/message-exchanges.md)
- 📬 [Two delivery models (Point-to-Point and Pub/Sub) with reliable delivery and configurable retry modes](packages/redis-smq/docs/queue-delivery-models.md)
- 📊 [Three queuing strategies (FIFO, LIFO, Priority Queues)](packages/redis-smq/docs/queues.md)
- 🧵 [Message handler worker threads for sandboxing and performance](packages/redis-smq/docs/message-handler-worker-threads.md)
- ️️️️⏱️ [Message expiration and consumption timeout](packages/redis-smq/docs/messages.md)
- 🚦 [Queue rate limiting for controlling message consumption rates](packages/redis-smq/docs/queue-rate-limiting.md)
- ️️️🕰️ [Built-in scheduler for delayed and repeating messages](packages/redis-smq/docs/scheduling-messages.md)
- 🌐 [RESTful API](packages/redis-smq-rest-api/README.md) and [Web UI](packages/redis-smq-web-ui/README.md)
- 📦 [ESM and CJS support](packages/redis-smq/docs/esm-cjs-modules.md)

**Use Cases**

- Managing background tasks (emails, data processing)
- Scheduling and retrying tasks
- Communication between services in microservices architectures
- Handling real-time events in gaming, IoT, or analytics

**Requirements**

- Node.js 20+
- Redis server (tested with Redis 7.x)
- One Redis client: ioredis or @redis/client

**Installation**

Install core packages:

```bash
npm i redis-smq@latest redis-smq-common@latest --save
```

Install a Redis client (choose one):

```bash
npm install ioredis --save
# or
npm install @redis/client --save
```

**Ecosystem**

| Package                                                                            | Description                                          |
|------------------------------------------------------------------------------------|------------------------------------------------------|
| [packages/redis-smq/README.md](packages/redis-smq/README.md)                       | Core message queue for Node.js                       |
| [packages/redis-smq-common/README.md](packages/redis-smq-common/README.md)         | Shared components and utilities                      |
| [packages/redis-smq-rest-api/README.md](packages/redis-smq-rest-api/README.md)     | REST API with OpenAPI v3 and Swagger UI              |
| [packages/redis-smq-web-server/README.md](packages/redis-smq-web-server/README.md) | Web server to host the UI and in-process/proxied API |
| [packages/redis-smq-web-ui/README.md](packages/redis-smq-web-ui/README.md)         | SPA for monitoring and managing RedisSMQ             |

**Version compatibility**

Always install matching versions of RedisSMQ packages. See [version-compatibility.md](packages/redis-smq/docs/version-compatibility.md).

**Quick Start (required initialization)**

RedisSMQ must be initialized once per process before creating any producers, consumers, or managers.

Option A: Initialize with Redis connection (recommended for most)

```typescript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

// Initialize once with Redis connection details
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
  (err) => {
    if (err) {
      console.error('Failed to initialize RedisSMQ:', err);
      return;
    }

    // Create components after initialization
    const producer = RedisSMQ.createProducer();
    const consumer = RedisSMQ.createConsumer();

    // Start producer
    producer.run((pe) => {
      if (pe) return console.error('Producer start failed:', pe);
      console.log('Producer ready');
    });

    // Start consumer
    consumer.run((ce) => {
      if (ce) return console.error('Consumer start failed:', ce);
      console.log('Consumer ready');
    });
  },
);
```

Option B: Initialize with a full RedisSMQ configuration (persisted in Redis)

Use when you want configuration persisted and shared across processes. On first run, the config is saved. Subsequent processes can initialize normally (using `RedisSMQ.initialize`).

```typescript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient, EConsoleLoggerLevel } from 'redis-smq-common';

RedisSMQ.initializeWithConfig(
  {
    namespace: 'my_project_name',
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: { host: '127.0.0.1', port: 6379, db: 0 },
    },
    logger: { enabled: true, options: { logLevel: EConsoleLoggerLevel.INFO } },
    messages: { store: false },
    eventBus: { enabled: false },
  },
  (err) => {
    if (err) {
      console.error('Failed to initialize with config:', err);
      return;
    }
    console.log('RedisSMQ initialized (configuration persisted in Redis)');
  },
);
```

**Usage**

Create a queue, produce a message, and consume it. Ensure RedisSMQ has been initialized first (see Quick Start).

```typescript
import { RedisSMQ, ProducibleMessage, EQueueType, EQueueDeliveryModel } from 'redis-smq';

// 1) Create a queue
const queueManager = RedisSMQ.createQueueManager();
queueManager.save(
  'my_queue',
  EQueueType.LIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err) => {
    if (err) return console.error('Queue creation failed:', err);
    console.log('Queue created');
  },
);

// 2) Produce a message
const producer = RedisSMQ.createProducer();
const msg = new ProducibleMessage().setQueue('my_queue').setBody('Hello World!');
producer.produce(msg, (err, ids) => {
  if (err) return console.error('Produce failed:', err);
  console.log(`Produced message IDs: ${ids.join(', ')}`);
});

// 3) Consume messages
const consumer = RedisSMQ.createConsumer();
const handler = (message: any, done: (err?: Error | null) => void) => {
  console.log('Received:', message.body);
  done(); // Acknowledge
};
consumer.consume('my_queue', handler, (err) => {
  if (err) return console.error('Consumer start failed:', err);
  console.log('Consuming my_queue...');
});
```

**Configuration (optional)**

Using the Configuration class directly is optional. After `RedisSMQ.initialize(...)` or `RedisSMQ.initializeWithConfig(...)`, you can inspect or update the persisted configuration if needed.

```typescript
import { Configuration } from 'redis-smq';

// Read current config
const current = Configuration.getConfig();
console.log('Current config:', current);

// Update selected parts and persist
Configuration.getInstance().updateConfig(
  { logger: { enabled: true } },
  (err) => {
    if (err) return console.error('Config update failed:', err);
    console.log('Configuration updated');
  },
);
```

**Docs**

- Full documentation: [packages/redis-smq/docs/README.md](packages/redis-smq/docs/README.md)
- REST API: [packages/redis-smq-rest-api/README.md](packages/redis-smq-rest-api/README.md)
- Web UI: [packages/redis-smq-web-ui/README.md](packages/redis-smq-web-ui/README.md)

_Important note:_
- This README and in-repo documentation reflect the latest changes from the master branch.
- For documentation of the latest stable release, start at https://github.com/weyoss/redis-smq/releases/latest and 
  browse the docs under source tree of the selected tag.

**Contributing**

We welcome contributions. Please read [CONTRIBUTING.md](CONTRIBUTING.md).

**License**

RedisSMQ is released under the [MIT License](LICENSE).
