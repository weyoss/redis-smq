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

With multiplexing, all handlers share one Redis connection:

```
Consumer (multiplexed)
├── Handler for queue "orders"    ┐
├── Handler for queue "emails"    ├── Redis connection 1 → sequential
└── Handler for queue "reports"   ┘
```

Messages are dequeued and processed one at a time across all queues sharing the connection. A slow handler blocks other queues.

## When to Use

### Use Multiplexing When

- You have many queues with low traffic
- You need to minimize Redis connections (serverless, PaaS with connection limits)
- Connection management overhead matters more than throughput

### Avoid Multiplexing When

- You need maximum throughput
- Queues have high traffic
- Handlers do slow processing (blocks other queues)
- You want parallel processing across queues

## Enabling Multiplexing

Pass `true` when creating a consumer:

```javascript
const { RedisSMQ } = require('redis-smq');

const consumer = RedisSMQ.createConsumer(true); // Multiplexed

// Add multiple queues — all share one connection
consumer.consume('queue1', handler1, callback);
consumer.consume('queue2', handler2, callback);
consumer.consume('queue3', handler3, callback);

consumer.run((err) => {
  if (err) console.error('Failed to start:', err);
});
```

Non-multiplexed (default):

```javascript
const consumer = RedisSMQ.createConsumer(); // No multiplexing
// Each handler gets its own connection
```

## Performance Implications

Since processing is sequential, slow handlers block all other queues on the same multiplexed consumer:

```javascript
// Fast — minimal impact on other queues
consumer.consume(
  'fast-queue',
  (msg, done) => {
    processQuickly(msg.body);
    done();
  },
  callback,
);

// Slow — blocks all other queues sharing this connection
consumer.consume(
  'slow-queue',
  (msg, done) => {
    setTimeout(() => {
      processSlowly(msg.body);
      done();
    }, 10000);
  },
  callback,
);
```

## Grouping Strategies

### Low-Traffic Queues Together

Group queues with similar, low traffic patterns on one multiplexed consumer:

```javascript
const lowTrafficConsumer = RedisSMQ.createConsumer(true);
lowTrafficConsumer.consume('logs', handler, callback);
lowTrafficConsumer.consume('metrics', handler, callback);
lowTrafficConsumer.consume('alerts', handler, callback);
```

### High-Traffic Queues Separate

Give high-traffic queues their own non-multiplexed consumers for maximum throughput:

```javascript
const ordersConsumer = RedisSMQ.createConsumer(); // Dedicated
ordersConsumer.consume('orders', handler, callback);

const paymentsConsumer = RedisSMQ.createConsumer(); // Dedicated
paymentsConsumer.consume('payments', handler, callback);
```

### Mixed Approach

Use multiplexing for low-traffic queues and dedicated consumers for high-traffic ones:

```javascript
// Low-traffic — multiplexed
const utilityConsumer = RedisSMQ.createConsumer(true);
utilityConsumer.consume('logs', logHandler, callback);
utilityConsumer.consume('emails', emailHandler, callback);

// High-traffic — dedicated
const ordersConsumer = RedisSMQ.createConsumer();
ordersConsumer.consume('orders', orderHandler, callback);
```

## Managing Multiplexed Consumers

### Stopping Individual Queues

Cancel a specific queue while keeping others running:

```javascript
consumer.cancel('slow-queue', (err) => {
  if (err) console.error('Cancel failed:', err);
  else console.log('Stopped consuming from slow-queue');
});
```

### Checking Registered Queues

```javascript
const queues = consumer.getQueues();
console.log('Multiplexed queues:', queues);
```

## Shutdown

Multiplexed consumers shut down the same way as regular consumers. All handlers are stopped and the shared connection is released:

```javascript
consumer.shutdown((err) => {
  if (err) console.error('Shutdown error:', err);
});

// Or use system shutdown for all components
RedisSMQ.shutdown(callback);
```

## Best Practices

- **Keep handlers fast** — sequential processing means slow handlers block everyone
- **Group similar queues** — similar traffic patterns work well together
- **Isolate hot queues** — high-traffic queues deserve their own connection
- **Monitor queue depth** — multiplexed queues can fall behind if a slow handler blocks them
- **Use multiple multiplexed consumers** — spread queues across several consumers for better parallelism
