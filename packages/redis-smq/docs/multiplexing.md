[RedisSMQ](../README.md) / [Documentation](README.md) / Multiplexing

# Multiplexing

Multiplexing lets multiple message handlers share a single Redis connection. It reduces connection usage at the cost of processing messages sequentially instead of in parallel.

## How It Works

Without multiplexing, each message handler gets its own Redis connection and processes messages independently:

```
Consumer
├── Handler for queue "orders"    → Redis connection 1 → parallel
├── Handler for queue "emails"    → Redis connection 2 → parallel
└── Handler for queue "reports"   → Redis connection 3 → parallel
```

With multiplexing, all handlers share one Redis connection and are driven by a single round-robin tick loop:

```
Consumer (multiplexed)
├── Handler for queue "orders"    ┐
├── Handler for queue "emails"    ├── Redis connection 1 → sequential
└── Handler for queue "reports"   ┘
```

At each tick (one second by default), the multiplexing controller picks the next operational handler whose queue is `ACTIVE` and calls `dequeue()` on it. The handler processes at most one message and then yields control back to the controller, which waits for the next tick before choosing the next handler. A slow handler blocks every other queue sharing the same consumer.

## When to Use

### Use Multiplexing When

- You have many queues with low traffic
- You need to minimize Redis connections (serverless, PaaS with connection limits)
- Connection management overhead matters more than per-message latency

### Avoid Multiplexing When

- You need maximum throughput
- Queues have high traffic
- Handlers do slow processing (blocks other queues)
- You want parallel processing across queues

## Enabling Multiplexing

Pass `{ enableMultiplexing: true }` when creating a consumer through the `RedisSMQ` factory:

```javascript
const { RedisSMQ } = require('redis-smq');

// Multiplexed — all handlers on this consumer share one connection
const consumer = RedisSMQ.createConsumer({ enableMultiplexing: true });

const handler = (message, done) => {
  console.log(message.body);
  done();
};

await consumer.consume('queue1', handler);
await consumer.consume('queue2', handler);
await consumer.consume('queue3', handler);

await consumer.run();
```

Non-multiplexed (the default):

```javascript
const consumer = RedisSMQ.createConsumer();
// Each handler acquires its own connection
```

The `Consumer` class is not exported from the package root — construct consumers through `RedisSMQ.createConsumer(options)`. The flag can also be set globally for all future consumers via `RedisSMQ.setDefaultConsumerOptions({ enableMultiplexing: true })`.

## Performance Implications

Since processing is sequential, slow handlers block all other queues on the same multiplexed consumer:

```javascript
// Fast — minimal impact on other queues
await consumer.consume('fast-queue', (msg, done) => {
  processQuickly(msg.body);
  done();
});

// Slow — blocks every other queue sharing this consumer
await consumer.consume('slow-queue', (msg, done) => {
  setTimeout(() => {
    processSlowly(msg.body);
    done();
  }, 10000);
});
```

A handler that holds the tick for ten seconds prevents the controller from advancing to any other queue during that time. Handlers that are CPU-bound on the main thread also hold the tick — the controller cannot preempt them. Worker-thread handlers (see [Worker Threads](message-handler-worker-threads.md)) are the exception: the main thread is free while the worker computes, but the multiplexed consumer still waits for the worker's result before moving to the next handler.

## Grouping Strategies

### Low-Traffic Queues Together

Group queues with similar, low traffic patterns on one multiplexed consumer:

```javascript
const lowTrafficConsumer = RedisSMQ.createConsumer({
  enableMultiplexing: true,
});
const logHandler = (msg, done) => {
  /* ... */ done();
};
await lowTrafficConsumer.consume('logs', logHandler);
await lowTrafficConsumer.consume('metrics', logHandler);
await lowTrafficConsumer.consume('alerts', logHandler);
```

### High-Traffic Queues Separate

Give high-traffic queues their own non-multiplexed consumers for maximum throughput:

```javascript
const ordersConsumer = RedisSMQ.createConsumer(); // Dedicated connection
const orderHandler = (msg, done) => {
  /* ... */ done();
};
await ordersConsumer.consume('orders', orderHandler);

const paymentsConsumer = RedisSMQ.createConsumer();
const paymentHandler = (msg, done) => {
  /* ... */ done();
};
await paymentsConsumer.consume('payments', paymentHandler);
```

### Mixed Approach

Use multiplexing for low-traffic queues and dedicated consumers for high-traffic ones:

```javascript
// Low-traffic — multiplexed
const utilityConsumer = RedisSMQ.createConsumer({ enableMultiplexing: true });
await utilityConsumer.consume('logs', logHandler);
await utilityConsumer.consume('emails', emailHandler);

// High-traffic — dedicated
const ordersConsumer = RedisSMQ.createConsumer();
await ordersConsumer.consume('orders', orderHandler);
```

## Managing Multiplexed Consumers

### Stopping Individual Queues

Cancel a specific queue while keeping others running:

```javascript
await consumer.cancel('slow-queue');
console.log('Stopped consuming from slow-queue');
```

The runner tears down that queue's handler and notifies the multiplexing controller, which picks the next operational handler on the next tick. Other queues are unaffected.

### Checking Registered Queues

```javascript
const queues = consumer.getQueues();
console.log('Multiplexed queues:', queues);

// Per-queue status: 'active' or 'stopped'
const withStatus = consumer.getQueuesWithStatus();
withStatus.forEach(({ queue, status }) => {
  console.log(`${queue.queueParams.name}: ${status}`);
});
```

## Shutdown

Multiplexed consumers shut down the same way as regular consumers. All handlers are stopped and the shared connection is released:

```javascript
await consumer.shutdown();

// Or use system shutdown for all components
await RedisSMQ.shutdown();
```

## Interaction with Queue State

The multiplexing controller skips any handler whose queue is not currently `ACTIVE`. When a queue transitions to `PAUSED`, `STOPPED`, or `LOCKED`, the runner stops that handler and the controller moves on to the next operational one. When the queue returns to `ACTIVE`, the runner restarts the handler and the controller picks it up again on the next tick.

This means a paused queue does not stall its siblings in a multiplexed consumer — the controller simply routes around it. See [Queue State Management](queue-state-management.md) for the transitions and [Consuming Messages](consuming-messages.md) for the runner's reaction to state changes.

## Best Practices

- **Keep handlers fast** — sequential processing means a slow handler blocks everyone sharing the consumer
- **Group similar queues** — similar traffic patterns work well together
- **Isolate hot queues** — high-traffic queues deserve their own dedicated consumer
- **Monitor queue depth** — multiplexed queues can fall behind if a slow handler blocks them
- **Use multiple multiplexed consumers** — spread queues across several consumers for better parallelism without giving each queue its own connection
- **Prefer worker threads for CPU work** — a CPU-bound handler on the main thread holds the tick for the entire consumer

## Related

- [Consuming Messages](consuming-messages.md) — Handler styles and consumer lifecycle
- [Worker Threads](message-handler-worker-threads.md) — Running CPU-bound handlers off the main thread
- [Queue State Management](queue-state-management.md) — PAUSED / STOPPED / LOCKED and how they affect multiplexed handlers
- [Batch Acknowledgments](message-batch-acknowledgements.md) — Complementary throughput optimization
