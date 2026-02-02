[RedisSMQ](../README.md) / [Docs](README.md) / Exchanges and Delivery Models

# Exchanges and Delivery Models

Exchanges route messages to queues. Delivery models control how queues deliver messages to consumers. Together, they
give you flexible messaging patterns.

## Quick Overview

| Component          | Purpose                      | Example                      |
| ------------------ | ---------------------------- | ---------------------------- |
| **Exchange**       | Routes messages to queues    | `setTopicExchange('events')` |
| **Delivery Model** | How queue sends to consumers | Point-to-Point or Pub/Sub    |

## How They Work Together

```
Producer → Exchange → Queues → Consumers
                         ↓
              Each queue has its own delivery model
```

### Example: Order System

```javascript
async.series(
  [
    // Create two queues with different delivery models
    (next) =>
      queueManager.save(
        'orders.worker',
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.POINT_TO_POINT,
        next,
      ),
    (next) =>
      queueManager.save(
        'orders.events',
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
        next,
      ),

    // Bind both to same exchange
    (next) =>
      directExchange.bindQueue(
        'orders.worker',
        'orders',
        'order.created',
        next,
      ),
    (next) =>
      directExchange.bindQueue(
        'orders.events',
        'orders',
        'order.created',
        next,
      ),

    // Send one message
    (next) => {
      const msg = new ProducibleMessage()
        .setDirectExchange('orders')
        .setExchangeRoutingKey('order.created')
        .setBody({ orderId: 123 });
      producer.produce(msg, next);
    },
  ],
  (err) => {
    // Result:
    // - orders.worker → One worker processes it
    // - orders.events → All consumer groups get it
  },
);
```

## Exchange Types

### 1. Direct Exchange

Routes to queues with exact routing key match.

```javascript
msg.setDirectExchange('payments');
msg.setExchangeRoutingKey('payment.success'); // Must match exactly
```

### 2. Topic Exchange

Routes using wildcard patterns:

- `*` = one word
- `#` = zero or more words

```javascript
msg.setTopicExchange('events');
msg.setExchangeRoutingKey('user.login.success'); // Matches 'user.*.success'
```

### 3. Fanout Exchange

Broadcasts to all bound queues.

```javascript
msg.setFanoutExchange('alerts'); // No routing key
```

## Delivery Models

### Point-to-Point

Each message to one consumer.

```javascript
// Queue setup
queueManager.save(
  'tasks',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  callback,
);

// Consumption (no group needed)
consumer.consume('tasks', (msg, done) => {
  // Only one consumer gets this message
  done();
});
```

### Pub/Sub

Messages to all consumer groups.

```javascript
// Queue setup
queueManager.save('notifications', QUEUE_TYPE, DELIVERY.PUB_SUB, callback);

// Create consumer groups
groups.saveConsumerGroup('notifications', 'email-service', callback);
groups.saveConsumerGroup('notifications', 'sms-service', callback);

// Each group consumes
consumer.consume(
  { queue: 'notifications', groupId: 'email-service' },
  (msg, done) => {
    // Email service processes
    done();
  },
  callback,
);
```

## Common Patterns

### 1. Task Processing + Event Broadcasting

```javascript
// Single message does both:
// 1. Process order (Point-to-Point)
// 2. Notify services (Pub/Sub)

// Exchange routes to both queues
// orders.worker → One worker processes
// orders.events → All services notified
```

### 2. Selective Routing

```javascript
// Topic exchange filters messages
msg.setTopicExchange('logs');
msg.setExchangeRoutingKey('app.error.critical');

// Queues bind to patterns:
// 'app.*'        - All app logs
// '*.error.*'    - All errors
// 'app.error.#'  - App errors only
```

### 3. Multi-Channel Broadcast

```javascript
// Fanout to all notification channels
msg.setFanoutExchange('system-alerts');

// Bound queues:
// - email-alerts
// - slack-alerts
// - dashboard-alerts
// All get the same message
```

## Setup Flow

1. **Create queues** with delivery models
2. **Create exchanges** (if needed)
3. **Bind queues** to exchanges
4. **Create consumer groups** for Pub/Sub queues
5. **Start consuming**

## Best Practices

1. **Use direct queues** (`setQueue()`) for simple cases - it's faster
2. **Combine patterns** when needed:
   - Exchange → Multiple queues
   - Different delivery per queue
3. **Plan consumer groups** for Pub/Sub:
   - One group per service/function
   - Meaningful names
4. **Handle "No matching queues"** error when publishing
5. **Set up bindings at startup** to avoid missing routes

## Example: Complete System

```javascript
async.series(
  [
    // Setup
    (next) =>
      queueManager.save(
        'worker-tasks',
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.POINT_TO_POINT,
        next,
      ),
    (next) =>
      queueManager.save(
        'service-events',
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
        next,
      ),

    (next) =>
      directExchange.bindQueue('worker-tasks', 'app', 'task.process', next),
    (next) =>
      directExchange.bindQueue('service-events', 'app', 'task.process', next),

    (next) => groups.saveConsumerGroup('service-events', 'email', next),
    (next) => groups.saveConsumerGroup('service-events', 'analytics', next),

    // Send one message
    (next) => {
      const msg = new ProducibleMessage()
        .setDirectExchange('app')
        .setExchangeRoutingKey('task.process')
        .setBody({ task: 'process-user' });
      producer.produce(msg, next);
    },
  ],
  (err) => {
    // Result:
    // worker-tasks → One worker processes
    // service-events → Email AND analytics both receive
  },
);
```

---

**Related**:

- [Message Exchanges](message-exchanges.md) - Exchange types and routing
- [Queue Delivery Models](queue-delivery-models.md) - Point-to-Point vs. Pub/Sub
- [Producing Messages](producing-messages.md) - How to send messages
