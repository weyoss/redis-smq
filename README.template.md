[![RedisSMQ](./logo.png)](https://github.com/weyoss/redis-smq)

__NPM_BADGE__
__BUILD_BADGE__
__CODEQL_BADGE__

__IS_NEXT_NOTE__

A high-performance Redis message queue for Node.js — simple to use, built for scale.

## ✨ Features

- 📬 [Reliable delivery](packages/redis-smq/docs/queue-delivery-models.md) with retry mechanisms
- 📊 [Multiple queue strategies](packages/redis-smq/docs/queues.md): FIFO, LIFO, and Priority Queues
- 🔀 [Exchange patterns](packages/redis-smq/docs/message-exchanges.md): Direct, Topic, and Fanout routing
- 🚦 [Rate limiting](packages/redis-smq/docs/queue-rate-limiting.md) for controlled message consumption
- 🕰️ [Built-in scheduler](packages/redis-smq/docs/scheduling-messages.md) for delayed and repeating messages
- 🚀 [High-throughput processing](packages/redis-smq/docs/performance.md)
- 🧵 [Worker threads](packages/redis-smq/docs/message-handler-worker-threads.md) for sandboxing and performance
- ⏱️ [Message expiration](packages/redis-smq/docs/messages.md) and consumption timeouts
- 🔄 [Multi-queue](packages/redis-smq/docs/consuming-messages.md) producers and consumers
- 🌐 [REST API](packages/redis-smq-rest-api/README.md) with OpenAPI v3 and Swagger UI
- 📊 [Web UI](packages/redis-smq-web-ui/README.md) for real-time monitoring
- 📦 [ESM & CJS](packages/redis-smq/docs/esm-cjs-modules.md) module support

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
npm install redis-smq__TAG_SUFFIX__ redis-smq-common__TAG_SUFFIX__ --save

# Pick a Redis client
npm install ioredis --save
# OR
npm install @redis/client --save
```

> ⚠️ **v9 Breaking Changes:** If upgrading, read the [v9.0.0 Release Notes](release-notes/release-v9.md).

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

## 📦 Packages

| Package | Description |
|---------|-------------|
| **[redis-smq](packages/redis-smq/README.md)** | Core message queue library |
| **[redis-smq-common](packages/redis-smq-common/README.md)** | Shared utilities |
| **[redis-smq-rest-api](packages/redis-smq-rest-api/README.md)** | REST API with Swagger UI |
| **[redis-smq-web-ui](packages/redis-smq-web-ui/README.md)** | Web dashboard |
| **[redis-smq-web-server](packages/redis-smq-web-server/README.md)** | Web server for UI & API |
| **[redis-smq-benchmarks](packages/redis-smq-benchmarks/README.md)** | Performance testing |

> 🔗 **Version Compatibility:** Always use matching versions. See [version compatibility guide](packages/redis-smq/docs/version-compatibility.md).

## 📚 Documentation

- **[Full Documentation](packages/redis-smq/docs/README.md)** - Complete API reference and guides
- **[REST API](packages/redis-smq-rest-api/README.md)** - API endpoints and usage
- **[Web UI](packages/redis-smq-web-ui/README.md)** - Dashboard setup and features

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

RedisSMQ is released under the [MIT License](LICENSE).
