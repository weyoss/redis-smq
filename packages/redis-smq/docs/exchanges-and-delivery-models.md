[RedisSMQ](../README.md) / [Documentation](README.md) / Exchanges and Delivery Models

# Exchanges and Delivery Models

Exchanges route messages to queues. Delivery models control how queues deliver messages to consumers. Together, they give you flexible messaging patterns.

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

A single exchange can route to queues with different delivery models:

```javascript
// Create two queues with different delivery models
queueManager.save(
  'orders.worker',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  callback,
);
queueManager.save(
  'orders.events',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.PUB_SUB,
  callback,
);

// Bind both to the same exchange
directExchange.bindQueue('orders.worker', 'orders', 'order.created', callback);
directExchange.bindQueue('orders.events', 'orders', 'order.created', callback);

// One message → two delivery patterns
const msg = new ProducibleMessage()
  .setDirectExchange('orders')
  .setExchangeRoutingKey('order.created')
  .setBody({ orderId: 123 });

producer.produce(msg, callback);
// Result:
// - orders.worker → one worker processes it (Point-to-Point)
// - orders.events → all consumer groups get it (Pub/Sub)
```

## Exchange Types

### Direct Exchange

Routes to queues with exact routing key match.

```javascript
const directExchange = RedisSMQ.createDirectExchange();

// Bind a queue to a routing key
directExchange.bindQueue(
  'email-queue',
  'notifications',
  'welcome.email',
  callback,
);

// Send a message
const msg = new ProducibleMessage()
  .setDirectExchange('notifications')
  .setExchangeRoutingKey('welcome.email') // Must match exactly
  .setBody({ to: 'user@example.com' });
```

### Topic Exchange

Routes using wildcard patterns:

- `*` matches exactly one dot-separated word
- `#` matches zero or more dot-separated words

```javascript
const topicExchange = RedisSMQ.createTopicExchange();

// Bind queues with patterns
topicExchange.bindQueue('audit-queue', 'events', 'user.*', callback);
topicExchange.bindQueue('alert-queue', 'events', '*.error.#', callback);

// Send a message
const msg = new ProducibleMessage()
  .setTopicExchange('events')
  .setExchangeRoutingKey('user.login.success')
  .setBody({ userId: 123 });
```

### Fanout Exchange

Broadcasts to all bound queues. No routing key needed.

```javascript
const fanoutExchange = RedisSMQ.createFanoutExchange();

// Bind multiple queues
fanoutExchange.bindQueue('email-service', 'alerts', callback);
fanoutExchange.bindQueue('sms-service', 'alerts', callback);
fanoutExchange.bindQueue('push-service', 'alerts', callback);

// Send once, delivers to all
const msg = new ProducibleMessage()
  .setFanoutExchange('alerts')
  .setBody({ message: 'System update in 5 minutes' });
```

## Direct to Queue (No Exchange)

The fastest path. Skip the exchange and send directly to a queue:

```javascript
const msg = new ProducibleMessage()
  .setQueue('orders') // Direct delivery
  .setBody({ orderId: 123 });
```

Use this when you know the destination queue and don't need routing flexibility.

## Managing Exchanges

### Create and Delete

```javascript
// Exchanges are created automatically when first bound
// But can be created explicitly:
const directExchange = RedisSMQ.createDirectExchange();
directExchange.create('orders', (err) => { ... });
directExchange.delete('orders', (err) => { ... });
```

### List Bindings

```javascript
// Get routing keys for a direct exchange
directExchange.getRoutingKeys('orders', (err, keys) => {
  console.log('Routing keys:', keys);
});

// Get queues bound to a routing key
directExchange.getQueues('orders', 'order.created', (err, queues) => {
  console.log('Bound queues:', queues);
});

// Get all bindings
directExchange.getAllBindings('orders', (err, bindings) => {
  console.log('All bindings:', bindings);
});
```

### Unbind Queues

```javascript
directExchange.unbindQueue(
  'email-queue',
  'notifications',
  'welcome.email',
  callback,
);
fanoutExchange.unbindQueue('sms-service', 'alerts', callback);
topicExchange.unbindQueue('audit-queue', 'events', 'user.*', callback);
```

## Delivery Models

### Point-to-Point

Each message goes to exactly one consumer:

```javascript
queueManager.save(
  'tasks',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  callback,
);

// No group needed
consumer.consume(
  'tasks',
  (message, done) => {
    // Only one consumer processes this message
    done();
  },
  callback,
);
```

### Pub/Sub

Messages broadcast to all consumer groups:

```javascript
queueManager.save(
  'notifications',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.PUB_SUB,
  callback,
);

// Create consumer groups
consumerGroups.saveConsumerGroup('notifications', 'email-service', callback);
consumerGroups.saveConsumerGroup('notifications', 'sms-service', callback);

// Each group consumes independently
consumer.consume(
  { queue: 'notifications', groupId: 'email-service' },
  handler,
  callback,
);

consumer.consume(
  { queue: 'notifications', groupId: 'sms-service' },
  handler,
  callback,
);
```

## Common Patterns

### Task Processing + Event Broadcasting

```javascript
// One exchange, two queues, two delivery models
// orders.worker (Point-to-Point) → one worker processes
// orders.events (Pub/Sub) → all services notified
```

### Selective Routing

```javascript
// Topic exchange filters messages
msg.setTopicExchange('logs');
msg.setExchangeRoutingKey('app.error.critical');

// Queues bind to patterns:
// 'app.*'        → all app logs
// '*.error.*'    → all errors
// 'app.error.#'  → app errors only
```

### Multi-Channel Broadcast

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

1. Create queues with delivery models
2. Create exchanges (or let them auto-create on bind)
3. Bind queues to exchanges
4. Create consumer groups for Pub/Sub queues
5. Start producing and consuming

## Best Practices

- **Use direct-to-queue** for simple cases — it's faster
- **Combine patterns** — exchanges route to multiple queues with different delivery models
- **Plan consumer groups** — one group per service or function
- **Handle "no matching queues"** — check for this error when publishing to exchanges
- **Set up bindings at startup** — configure routing before sending messages

## Related

- [Message Exchanges](https://github.com/weyoss/redis-smq-docs) — Exchange concepts
- [Queue Delivery Models](https://github.com/weyoss/redis-smq-docs) — Point-to-Point vs Pub/Sub
- [Producing Messages](producing-messages.md) — How to send messages
- [Consuming Messages](consuming-messages.md) — How to receive messages
