[RedisSMQ](../README.md) / [Documentation](README.md) / Dual Callback & Promise Support

# Dual Callback & Promise Support

## Core Philosophy

RedisSMQ is built with a **pure callback-based implementation** at its core, prioritizing performance and efficient
resource utilization. The library leverages Node.js's native asynchronous patterns without introducing additional
abstraction layers that could impact performance.

However, RedisSMQ provides a **dual API** that supports both traditional Node.js callbacks **and** modern
Promises/async-await patterns. This is achieved through a lightweight wrapper that adds promise support on top of the
performant callback implementation, giving you the best of both worlds.

## Performance-First Architecture

### Pure Callback Foundation

RedisSMQ's internals are implemented using pure callbacks to:

- **Minimize overhead** - No additional promise wrapper overhead in the hot path
- **Optimize memory usage** - Reduced object allocations compared to promise chains
- **Enable fine-grained control** - Direct access to the event loop and execution flow
- **Maximize throughput** - Efficient handling of high-volume message processing

### Dual API Layer

The public API provides both patterns through a simple wrapper that:

- **Preserves performance** - When using callbacks, zero overhead
- **Adds promise support** - Lightweight wrapper for modern async/await usage
- **Maintains consistency** - Same behavior regardless of the chosen pattern
- **Enables gradual migration** - Mix and match patterns as needed

## API Pattern

Every asynchronous method follows this pattern:

```text
method(params, callback?) => Promise<T> | void
```

- **With callback**: Zero overhead, direct execution with callback
- **Without callback**: Lightweight Promise wrapper on top of callback implementation

## Performance Characteristics

### Callback Mode (Zero Overhead)

```typescript
// Direct execution - maximum performance
producer.produce(message, (err, ids) => {
  if (err) {
    // Handle error
  } else {
    // Process result
  }
});
```

### Promise Mode (Minimal Overhead)

```typescript
// Lightweight wrapper - convenient async/await
const ids = await producer.produce(message);
```

The promise wrapper adds minimal overhead and is suitable for most use cases. For maximum throughput in
high-performance scenarios, the callback pattern is recommended.

## Usage Examples

### Callback Pattern - Maximum Performance

```typescript
import { RedisSMQ } from 'redis-smq';
import { async } from 'redis-smq-common';

const producer = RedisSMQ.createProducer();

// Pure callback flow
async.series(
  [
    (cb) => RedisSMQ.initialize(redisConfig, cb),
    (cb) => producer.run(cb),
    (cb) => {
      let i = 0;
      const produce = () => {
        if (i < 1000) {
          i++;
          const message = new ProducibleMessage()
            .setQueue('high-throughput-queue')
            .setBody({ id: i, data: 'payload' });

          producer.produce(message, (err) => {
            if (err) {
              console.error('Failed to produce:', err);
              return cb(err);
            }
            produce();
          });
        } else {
          cb(null);
        }
      };
      produce();
    },
  ],
  (err) => {
    if (err) console.log(err);
  },
);
```

### Promise Pattern - Clean & Readable

```typescript
import { RedisSMQ } from 'redis-smq';

// Promise-based flow
try {
  await RedisSMQ.initialize(redisConfig);

  const producer = RedisSMQ.createProducer();
  await producer.run();

  // Clean async/await syntax for business logic
  for (let i = 0; i < 1000; i++) {
    const message = new ProducibleMessage()
      .setQueue('high-throughput-queue')
      .setBody({ id: i, data: 'payload' });

    await producer.produce(message);
  }
} catch (err) {
  console.error('Error:', err);
}
```

## Method Categories with Dual Support

### Configuration & Lifecycle

```typescript
// Callback - maximum performance
RedisSMQ.initialize(redisConfig, (err) => {
  /* ... */
});
RedisSMQ.shutdown((err) => {
  /* ... */
});

// Promise - convenient async/await
await RedisSMQ.initialize(redisConfig);
await RedisSMQ.shutdown();
```

### Producer Operations

```typescript
const producer = RedisSMQ.createProducer();

// Callback - zero overhead
producer.run((err) => {
  /* ... */
});
producer.produce(message, (err, ids) => {
  /* ... */
});

// Promise - with wrapper
await producer.run();
const ids = await producer.produce(message);
```

### Consumer Operations

```typescript
const consumer = RedisSMQ.createConsumer();

// Callback - optimal for high-volume consumption
consumer.run((err) => {
  /* ... */
});
consumer.consume(queue, handler, (err) => {
  /* ... */
});

// Promise - clean for setup code
await consumer.run();
await consumer.consume(queue, handler);
```

### Queue Management

```typescript
const queueManager = new QueueManager();

// Callback - efficient for batch operations
queueManager.getQueues((err, queues) => {
  /* ... */
});
queueManager.save(queue, type, model, (err, result) => {
  /* ... */
});

// Promise - readable for sequential logic
const queues = await queueManager.getQueues();
const result = await queueManager.save(queue, type, model);
```

## Performance Considerations

### When to Use Callbacks

- **High-throughput producers** - Processing thousands of messages per second
- **Real-time consumers** - Low-latency message processing
- **Batch operations** - Processing large volumes of messages
- **Resource-constrained environments** - Minimizing memory allocations

```typescript
// High-throughput batch processing with callbacks
const messages = generateMessages(10000);
let processed = 0;

messages.forEach((msg) => {
  producer.produce(msg, (err) => {
    processed++;
    if (processed === messages.length) {
      console.log('All messages processed');
    }
  });
});
```

### When to Use Promises

- **Configuration and setup** - One-time initialization code
- **Management operations** - Administrative tasks and monitoring
- **Business logic** - Complex workflows with sequential steps
- **Error handling** - Clean try/catch patterns

```typescript
// Business workflow with promises
async function processOrder(order) {
  try {
    // Sequential steps with clean async/await
    await validateOrder(order);
    const queue = await createOrderQueue(order);
    const message = createOrderMessage(order);
    const messageId = await producer.produce(message);
    await updateOrderStatus(order.id, 'processed', messageId);
  } catch (err) {
    await handleOrderError(order, err);
  }
}
```

---

Related:

- [Callback vs Promise vs Async/Await](https://gist.github.com/weyoss/24f9ecbda175d943a48cb7ec38bde821)
