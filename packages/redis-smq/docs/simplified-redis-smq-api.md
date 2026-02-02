[RedisSMQ](../README.md) / [Docs](README.md) / Simplified RedisSMQ API

# Simplified RedisSMQ API

The easiest way to use RedisSMQ. One initialization, simple factory methods, automatic cleanup.

## Quick Start

### 1. Initialize Once

```javascript
const { RedisSMQ } = require('redis-smq');

// Do this once when your app starts
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
  (err) => {
    if (err) console.error('Failed to start:', err);
    else console.log('RedisSMQ ready');
  },
);
```

### 2. Create and Start Components

```javascript
// Producer (send messages)
const producer = RedisSMQ.startProducer((err) => {
  if (err) console.error('Failed:', err);
  else console.log('Producer running');
});

// Consumer (receive messages)
const consumer = RedisSMQ.startConsumer((err) => {
  if (err) console.error('Failed:', err);
  else console.log('Consumer running');
});
```

### 3. Shutdown Everything

```javascript
// Clean up when app exits
RedisSMQ.shutdown((err) => {
  if (err) console.error('Shutdown error:', err);
  else console.log('All connections closed');
});
```

## Factory Methods

Create components with one line:

### Producers

```javascript
const producer = RedisSMQ.createProducer();
// or create and start
const producer = RedisSMQ.startProducer(callback);
```

### Consumers

```javascript
const consumer = RedisSMQ.createConsumer();
// or create and start
const consumer = RedisSMQ.startConsumer(callback);
```

### Managers

```javascript
const queueManager = RedisSMQ.createQueueManager();
const messageManager = RedisSMQ.createMessageManager();
const rateLimitManager = RedisSMQ.createQueueRateLimit();
```

### Exchanges

```javascript
const directExchange = RedisSMQ.createDirectExchange();
const topicExchange = RedisSMQ.createTopicExchange();
const fanoutExchange = RedisSMQ.createFanoutExchange();
```

## Full Example

```javascript
const { RedisSMQ, ProducibleMessage } = require('redis-smq');

// 1. Initialize
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
  (err) => {
    if (err) throw err;

    // 2. Create producer and consumer
    const producer = RedisSMQ.startProducer((err) => {
      if (err) throw err;

      // Send a message
      const msg = new ProducibleMessage()
        .setQueue('test')
        .setBody({ hello: 'world' });

      producer.produce(msg, (err, messageIds) => {
        if (err) console.error('Send failed:', err);
        else console.log('Sent:', messageIds[0]);
      });
    });

    const consumer = RedisSMQ.startConsumer((err) => {
      if (err) throw err;

      // Receive messages
      consumer.consume('test', (msg, done) => {
        console.log('Received:', msg.body);
        done();
      });
    });

    // 3. Handle shutdown
    process.on('SIGINT', () => {
      RedisSMQ.shutdown(() => {
        console.log('Clean exit');
        process.exit(0);
      });
    });
  },
);
```

## Configuration Options

### Basic Setup

```javascript
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
  callback,
);
```

### Advanced Setup (First Time)

```javascript
// Use initializeWithConfig for first-time configuration
RedisSMQ.initializeWithConfig(
  {
    namespace: 'myapp-prod',
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: { host: '127.0.0.1', port: 6379, db: 0 },
    },
    eventBus: { enabled: true },
    messageAudit: false,
    //...
  },
  callback,
);

// Later, just use initialize()
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: 6379, db: 0 },
  },
  callback,
);
```

## Best Practices

### 1. Initialize Once

```javascript
// ✅ Do this in your main file
RedisSMQ.initialize(config, callback);

// ❌ Don't initialize multiple times
// RedisSMQ.initialize(...); // Multiple times
```

### 2. Use Factory Methods

```javascript
// ✅ Let RedisSMQ manage components
const producer = RedisSMQ.createProducer();

// ❌ Avoid direct instantiation
// const producer = new Producer(); // Not tracked
```

### 3. Single Shutdown

```javascript
// ✅ Clean up everything
RedisSMQ.shutdown(callback);

// ❌ Avoid shutting down components individually
// producer.shutdown();
// consumer.shutdown();
// queueManager.shutdown();
```

---

**Related**:

- [Configuration](configuration.md) - Setup options
- [Producing Messages](producing-messages.md) - How to send messages
- [Consuming Messages](consuming-messages.md) - How to receive messages
- [EventBus](event-bus.md) - Monitoring events
