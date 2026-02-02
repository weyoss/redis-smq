[RedisSMQ](../README.md) / [Docs](README.md) / Multiplexing

# Multiplexing

Multiplexing lets multiple message handlers share one Redis connection. This reduces connection usage but processes
messages sequentially instead of in parallel.

## Default vs. Multiplexed

|                 | Default (One Connection Per Handler) | Multiplexed (Shared Connection) |
| --------------- | ------------------------------------ | ------------------------------- |
| **Connections** | Many                                 | One                             |
| **Processing**  | Parallel                             | Sequential                      |
| **Best For**    | High throughput                      | Many low-traffic queues         |

## When to Use Multiplexing

### ✅ Use Multiplexing When:

- You have many queues with low traffic
- You need to minimize Redis connections (serverless, PaaS limits)
- Connection management is more important than speed

### ⚠️ Avoid Multiplexing When:

- You need maximum throughput
- Queues have high traffic
- Handlers do slow processing (blocks other queues)

## How to Enable

### Create a Multiplexed Consumer

```javascript
const { RedisSMQ } = require('redis-smq');

// Pass `true` to enable multiplexing
const consumer = RedisSMQ.createConsumer(true);

// Add multiple queues - all share the same connection
consumer.consume(
  'queue1',
  (msg, done) => {
    console.log('Queue 1:', msg.body);
    done();
  },
  callback,
);

consumer.consume(
  'queue2',
  (msg, done) => {
    console.log('Queue 2:', msg.body);
    done();
  },
  callback,
);

consumer.consume(
  'queue3',
  (msg, done) => {
    console.log('Queue 3:', msg.body);
    done();
  },
  callback,
);

// Start once
consumer.run((err) => {
  if (err) console.error('Failed to start:', err);
  else console.log('Multiplexed consumer running');
});
```

### Default (Non-Multiplexed) Consumer

```javascript
// No parameter = separate connection per handler
const consumer = RedisSMQ.createConsumer();

// Each handler gets its own Redis connection
consumer.consume('queue1', handler1, callback);
consumer.consume('queue2', handler2, callback);
```

## Best Practices

### 1. Keep Handlers Fast

Since processing is sequential, slow handlers block other queues:

```javascript
// ✅ Fast
consumer.consume(
  'fast-queue',
  (msg, done) => {
    process(msg.body); // Quick operation
    done();
  },
  callback,
);

// ⚠️ Slow - blocks other queues
consumer.consume(
  'slow-queue',
  (msg, done) => {
    setTimeout(() => {
      // Long operation
      done();
    }, 10000);
  },
  callback,
);
```

### 2. Group Queues by Traffic

```javascript
// Low-traffic queues together
const lowTrafficConsumer = RedisSMQ.createConsumer(true);
lowTrafficConsumer.consume('logs', handler, callback);
lowTrafficConsumer.consume('metrics', handler, callback);
lowTrafficConsumer.consume('alerts', handler, callback);

// High-traffic queues separate
const highTrafficConsumer = RedisSMQ.createConsumer(); // No multiplexing
highTrafficConsumer.consume('orders', handler, callback);
highTrafficConsumer.consume('payments', handler, callback);
```

### 3. Monitor Queue Performance

```javascript
// Check which queues are multiplexed
const queues = consumer.getQueues();
console.log('Multiplexed queues:', queues);

// Stop consuming from a queue
consumer.cancel('slow-queue', (err) => {
  if (err) console.error('Cancel failed:', err);
  else console.log('Stopped consuming from slow-queue');
});
```

### 4. Scale with Multiple Consumers

```javascript
// Spread queues across multiple multiplexed consumers
const consumer1 = RedisSMQ.createConsumer(true);
consumer1.consume('queue1', handler, callback);
consumer1.consume('queue2', handler, callback);

const consumer2 = RedisSMQ.createConsumer(true);
consumer2.consume('queue3', handler, callback);
consumer2.consume('queue4', handler, callback);
```

## Connection Management

### Application Shutdown

```javascript
// Clean shutdown (recommended)
RedisSMQ.shutdown((err) => {
  if (err) console.error('Shutdown error:', err);
  else console.log('All connections closed');
});

// Or shutdown individual consumer
consumer.shutdown((err) => {
  if (err) console.error('Consumer shutdown error:', err);
});
```

## Real-World Example

### Serverless Environment

```javascript
// Serverless function with connection limits
exports.handler = async () => {
  const consumer = bluebird.promisifyAll(RedisSMQ.createConsumer(true)); // One shared connection between message handlers

  // Handle multiple event types
  await consumer.consumeAsync('user-events', userHandler, callback);
  await consumer.consumeAsync('order-events', orderHandler, callback);
  await consumer.consumeAsync('log-events', logHandler, callback);

  await consumer.runAsync();

  // Process for duration of function...

  // Clean up
  await RedisSMQ.shutdownAsync();
};
```

## Summary

- **Multiplexing = Shared connection, sequential processing**
- **Default = Separate connections, parallel processing**
- Choose based on your needs: connection limits vs. processing speed

---

**Related**:

- [Consumer API](api/classes/Consumer.md) - Complete consumer options
- [Configuration](configuration.md) - Connection settings
- [Consuming Messages](consuming-messages.md) - Message handling basics
