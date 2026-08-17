<div align="center" style="text-align: center">
  <p>
    <a href="https://github.com/weyoss/redis-smq">
      <img src="logo.png" alt="RedisSMQ" width="500px" />
    </a>
  </p>
  <p><strong>High‑performance Redis message queue for Node.js</strong><br />simple to use, built for scale.</p>
</div>

---

**Other implementations:** [go-redis-smq](https://github.com/weyoss/go-redis-smq) (Go)  
**Language‑agnostic concepts:** [redis-smq-docs](https://github.com/weyoss/redis-smq-docs) – architecture, queues, exchanges, and more.

## ✨ Why RedisSMQ?

- **Full‑featured** – FIFO, LIFO, priority queues, pub/sub, exchanges, scheduling, consumer groups, rate limiting.
- **Reliable** – Acknowledgements, dead‑letter queues, retries, and message persistence.
- **Administration included** – REST API (Swagger) and Web UI for monitoring and management.
- **Production‑ready** – Battle‑tested in high‑throughput environments.

## 📋 Requirements

- **Node.js** ≥ 20
- **Redis** ≥ 4 (persistence enabled for durability)
- A supported Redis client:
  - [`ioredis`](https://github.com/redis/ioredis) (recommended)
  - [`@redis/client`](https://github.com/redis/node-redis)

> 📊 See [BUILD.md](BUILD.md) for the latest build, quality, and release status across all branches.

## 📦 Packages

| Package                                                             | Description                              |
| ------------------------------------------------------------------- | ---------------------------------------- |
| **[redis-smq](packages/redis-smq/README.md)**                       | Core message queue library               |
| **[redis-smq-common](packages/redis-smq-common/README.md)**         | Shared utilities and configuration       |
| **[redis-smq-rest-api](packages/redis-smq-rest-api/README.md)**     | REST API with Swagger for administration |
| **[redis-smq-web-ui](packages/redis-smq-web-ui/README.md)**         | Web dashboard for queue monitoring       |
| **[redis-smq-web-server](packages/redis-smq-web-server/README.md)** | Combined web server (UI + API)           |
| **[redis-smq-benchmarks](packages/redis-smq-benchmarks/README.md)** | Performance testing suite                |

> 🔗 Always use matching versions across packages. See the [version compatibility guide](packages/redis-smq/docs/version-compatibility.md).  
> For cross‑implementation compatibility, refer to the [language‑agnostic version matrix](https://github.com/weyoss/redis-smq-docs#compatibility-matrix).

## 🚀 Quick Start

### 1. Install

```bash
# Core packages
npm install redis-smq redis-smq-common --save

# Pick a Redis client
npm install ioredis --save
# OR
npm install @redis/client --save
```

> ℹ️ The `@next` tag pulls the latest development version from the `next` branch.  
> For the stable release, use `@latest` (or omit the tag). Always check the [version compatibility guide](packages/redis-smq/docs/version-compatibility.md) and the [language‑agnostic compatibility matrix](https://github.com/weyoss/redis-smq-docs#compatibility-matrix) to ensure packages and implementations are aligned.

### 2. Initialize (once per process)

```javascript
import { RedisSMQ } from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379 },
  },
  (err) => {
    if (err) console.error('RedisSMQ init failed:', err);
    else console.log('✅ RedisSMQ initialized');
  },
);
```

### 3. Create a Queue

```javascript
import { RedisSMQ, EQueueType, EQueueDeliveryModel } from 'redis-smq';

const queueManager = RedisSMQ.createQueueManager();
queueManager.save(
  'my_queue',
  EQueueType.LIFO_QUEUE, // LIFO, FIFO, or PRIORITY
  EQueueDeliveryModel.POINT_TO_POINT, // or PUB_SUB
  (err) => {
    if (err) console.error('Queue creation failed:', err);
    else console.log('✅ Queue created');
  },
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
    .setBody({ hello: 'world' })
    .setRetryThreshold(3); // optional

  producer.produce(msg, (err, ids) => {
    if (err) console.error('Send failed:', err);
    else console.log(`📨 Sent message(s): ${ids.join(', ')}`);
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
    console.log('📥 Received:', message.getBody());
    // Process message...
    done(); // Acknowledge (or done(err) to reject)
  };

  consumer.consume('my_queue', handler, (err) => {
    if (err) console.error('Consume failed:', err);
    else console.log('👂 Listening on my_queue...');
  });
});
```

### Using Promises (async/await)

All methods support both callbacks and Promises. Here's the same flow using `async/await`:

```typescript
import {
  RedisSMQ,
  EQueueType,
  EQueueDeliveryModel,
  ProducibleMessage,
} from 'redis-smq';
import { ERedisConfigClient } from 'redis-smq-common';

try {
  // Initialize
  await RedisSMQ.initialize({
    client: ERedisConfigClient.IOREDIS,
    options: { host: 'localhost', port: 6379 },
  });

  // Create queue
  const queueManager = RedisSMQ.createQueueManager();
  await queueManager.save(
    'my_queue',
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  // Produce message
  const producer = RedisSMQ.createProducer();
  await producer.run();
  const message = new ProducibleMessage()
    .setQueue('my_queue')
    .setBody({ hello: 'world' });
  const messageIds = await producer.produce(message);
  console.log('Message published:', messageIds);

  // Consume messages
  const consumer = RedisSMQ.createConsumer();
  await consumer.run();
  await consumer.consume('my_queue', async (message) => {
    console.log('Received:', message.getBody());
    // Successful acknowledgement (no error thrown)
  });
} catch (err) {
  console.error('Error:', err);
}
```

Learn more about [dual callback & promise support](packages/redis-smq/docs/dual-callback-and-promise-support.md).

## 🛠️ Administration & Monitoring

The included **REST API** and **Web UI** can manage queues created by any RedisSMQ implementation (including Go).  
See the respective package READMEs for setup:

- [REST API Setup](packages/redis-smq-rest-api/README.md)
- [Web Dashboard Setup](packages/redis-smq-web-ui/README.md)

## 📚 Documentation

- [Core API reference](packages/redis-smq/docs/README.md)
- [REST API endpoints](packages/redis-smq-rest-api/README.md)
- [Shared concepts (language‑agnostic)](https://github.com/weyoss/redis-smq-docs)

## 📊 Benchmarks

Run the benchmark suite to measure throughput in your environment – see the [benchmarks package](packages/redis-smq-benchmarks/README.md).

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

MIT – see [LICENSE](LICENSE).
