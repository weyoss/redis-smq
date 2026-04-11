[![RedisSMQ](./logo.png)](https://github.com/weyoss/redis-smq)

[![Pre-release (next)](https://img.shields.io/npm/v/redis-smq/next?style=flat-square&label=redis-smq%40next)](https://github.com/weyoss/redis-smq/releases)
[![Build (next)](https://img.shields.io/github/actions/workflow/status/weyoss/redis-smq/tests.yml?branch=next&style=flat-square)](https://github.com/weyoss/redis-smq/actions/workflows/tests.yml?query=branch%3Anext)
[![Code Quality (next)](https://img.shields.io/github/actions/workflow/status/weyoss/redis-smq/codeql.yml?branch=next&style=flat-square&label=quality)](https://github.com/weyoss/redis-smq/actions/workflows/codeql.yml?query=branch%3Anext)

> 💡 **Note:** You are viewing the `next` branch with upcoming features. For stable releases, check the [`master` branch](https://github.com/weyoss/redis-smq/tree/master).

A high-performance Redis message queue for Node.js — simple to use, built for scale.

## ✨ Features

- 📬 [Reliable delivery](packages/redis-smq/docs/message-reliability.md) with retries
- 📊 [Multiple queue types](packages/redis-smq/docs/queues.md): FIFO, LIFO, Priority
- 🔀 [Flexible routing](packages/redis-smq/docs/message-exchanges.md): Direct/Topic/Fanout exchanges + Direct queue publishing
- 👥 [Pub/Sub & Point-to-Point](packages/redis-smq/docs/queue-delivery-models.md) delivery models with native consumer groups
- 🚦 [Queue-level rate limiting](packages/redis-smq/docs/queue-rate-limiting.md)
- ⏰ [Built-in scheduler](packages/redis-smq/docs/scheduling-messages.md): delays, CRON, repeating
- 🔒 [Queue state management](packages/redis-smq/docs/queue-state-management-system.md): pause/stop/resume + audit
- ⏱️ [Message TTL & consumption timeouts](packages/redis-smq/docs/messages.md)
- 🚀 [High-throughput design](packages/redis-smq/docs/performance.md) with atomic Lua scripts
- 📦 [Batch acks](packages/redis-smq/docs/message-batch-acknowledgements.md) & [Batch unacks](packages/redis-smq/docs/message-batch-unacknowledgements.md) — 99% fewer Redis calls
- 🧵 [Worker threads](packages/redis-smq/docs/message-handler-worker-threads.md) for CPU-heavy handlers
- 🔄 [Multi-queue producers & consumers](packages/redis-smq/docs/consuming-messages.md) with [multiplexing](packages/redis-smq/docs/multiplexing.md) support
- 📡 [Event bus](packages/redis-smq/docs/event-bus.md) for real-time internal events
- 🌐 [REST API](packages/redis-smq-rest-api/README.md) with OpenAPI + Swagger
- 📊 [Web UI](packages/redis-smq-web-ui/README.md) for live management
- 🎯 [Process-wide API](packages/redis-smq/docs/simplified-redis-smq-api.md) — initialize once, factory methods, single shutdown
- 🔄 [Dual callback & promise support](packages/redis-smq/docs/dual-callback-and-promise-support.md)
- 📦 [ESM + CJS](packages/redis-smq/docs/esm-cjs-modules.md) module support
- 📖 [TypeScript-first](packages/redis-smq/docs/api/README.md) with rich docs

## 🎯 Use Cases

- **Background jobs**: emails, reports, data processing
- **Task scheduling** with automatic retries
- **Microservices communication**
- **Real-time event processing** for gaming, IoT, analytics

## 📋 Requirements

- Node.js 20+
- Redis 4+
- Choose one Redis client: [`ioredis`](https://github.com/redis/ioredis) or [`@redis/client`](https://github.com/redis/node-redis)

## 🚀 Quick Start

### 1. Install

```bash
# Core packages
npm install redis-smq@next redis-smq-common@next --save

# Pick a Redis client
npm install ioredis --save
# OR
npm install @redis/client --save
```

### 2. Initialize (once per process)

```javascript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

// Simple initialization
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 }
  },
  (err) => {
    if (err) console.error('RedisSMQ init failed:', err);
  }
);
```

### 3. Create a Queue

```javascript
import { RedisSMQ, EQueueType, EQueueDeliveryModel } from 'redis-smq';

const queueManager = RedisSMQ.createQueueManager();
queueManager.save(
  'my_queue',
  EQueueType.LIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err) => {
    if (err) console.error('Queue creation failed:', err);
    else console.log('✅ Queue created');
  }
);
```

### 4. Produce a Message

```javascript
import { RedisSMQ, ProducibleMessage } from 'redis-smq';

const producer = RedisSMQ.createProducer();
producer.run((err) => {
  if (err) return console.error('Producer failed:', err);
  
  const msg = new ProducibleMessage()
    .setQueue('my_queue')
    .setBody('Hello World!');
  
  producer.produce(msg, (err, ids) => {
    if (err) console.error('Send failed:', err);
    else console.log(`📨 Sent message: ${ids.join(', ')}`);
  });
});
```

### 5. Consume Messages

```javascript
import { RedisSMQ } from 'redis-smq';

const consumer = RedisSMQ.createConsumer();
consumer.run((err) => {
  if (err) return console.error('Consumer failed:', err);
  
  const handler = (message, done) => {
    console.log('📥 Received:', message.body);
    done(); // Acknowledge
  };
  
  consumer.consume('my_queue', handler, (err) => {
    if (err) console.error('Consume failed:', err);
    else console.log('👂 Listening on my_queue...');
  });
});
```

## 🧩 Using Promises

```typescript
import { RedisSMQ, EQueueType, EQueueDeliveryModel } from 'redis-smq';

try {
  // Initialize RedisSMQ
  await RedisSMQ.initialize({
    client: ERedisConfigClient.IOREDIS,
    options: { host: 'localhost', port: 6379 }
  });
  
  // Create a Queue
  const queueManager = RedisSMQ.createQueueManager();
  await queueManager.save(
    'my_queue',
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  // Create and start a producer
  const producer = RedisSMQ.createProducer();
  await producer.run();

  // Send a message
  const message = new ProducibleMessage()
    .setQueue('my-queue')
    .setBody({ hello: 'world' });
  
  const messageIds = await producer.produce(message);
  console.log('Message published:', messageIds);

  // Create and start a consumer
  const consumer = RedisSMQ.createConsumer();
  await consumer.run();

  // Consume messages
  await consumer.consume('my-queue', async (message) => {
    console.log('Received:', message.getBody());
    // Successful acknowledgement 
  });
} catch (err) {
  console.error('Error:', err);
}
```

See [Dual Callback & Promise Support](packages/redis-smq/docs/dual-callback-and-promise-support.md).

## 📦 Packages

| Package                                                             | Description                |
|---------------------------------------------------------------------|----------------------------|
| **[redis-smq](packages/redis-smq/README.md)**                       | Core message queue library |
| **[redis-smq-common](packages/redis-smq-common/README.md)**         | Shared utilities           |
| **[redis-smq-rest-api](packages/redis-smq-rest-api/README.md)**     | REST API with Swagger UI   |
| **[redis-smq-web-ui](packages/redis-smq-web-ui/README.md)**         | Web dashboard              |
| **[redis-smq-web-server](packages/redis-smq-web-server/README.md)** | Web server for UI & API    |
| **[redis-smq-benchmarks](packages/redis-smq-benchmarks/README.md)** | Performance testing        |

> 🔗 **Version Compatibility:** Always use matching versions. See [version compatibility guide](packages/redis-smq/docs/version-compatibility.md).

## 📚 Documentation

- **[Full Documentation](packages/redis-smq/docs/README.md)** - Complete API reference and guides
- **[REST API](packages/redis-smq-rest-api/README.md)** - API endpoints and usage
- **[Web UI](packages/redis-smq-web-ui/README.md)** - Dashboard setup and features

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

RedisSMQ is released under the [MIT License](LICENSE).