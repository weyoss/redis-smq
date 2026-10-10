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
const { RedisSMQ, EQueueType, EQueueDeliveryModel } = require('redis-smq');

const queueManager = RedisSMQ.createQueueManager();
const directExchange = RedisSMQ.createDirectExchange();

// Create two queues with different delivery models
await queueManager.save(
  'orders.worker',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
);
await queueManager.save(
  'orders.events',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.PUB_SUB,
);

// Create the exchange, then bind both queues to it
await directExchange.create('orders', EExchangeQueuePolicy.STANDARD);
await directExchange.bindQueue('orders.worker', 'orders', 'order.created');
await directExchange.bindQueue('orders.events', 'orders', 'order.created');

// One message → two delivery patterns
const msg = RedisSMQ.newProducibleMessage()
  .setDirectExchange('orders')
  .setExchangeRoutingKey('order.created')
  .setBody({ orderId: 123 });

await producer.produce(msg);
// Result:
// - orders.worker → one worker processes it (Point-to-Point)
// - orders.events → all consumer groups get it (Pub/Sub)
```

**Exchanges must be created explicitly.** The current release does not auto-create an exchange when a queue is first bound — a `bindQueue` against a missing exchange rejects with `ExchangeNotFoundError`. Create the exchange first with `create(name, queuePolicy)`, then bind queues to it.

## Exchange Types

### Direct Exchange

Routes to queues with exact routing key match.

```javascript
const { RedisSMQ, EExchangeQueuePolicy } = require('redis-smq');

const directExchange = RedisSMQ.createDirectExchange();

// Create the exchange
await directExchange.create('notifications', EExchangeQueuePolicy.STANDARD);

// Bind a queue to a routing key
await directExchange.bindQueue('email-queue', 'notifications', 'welcome.email');

// Send a message
const msg = RedisSMQ.newProducibleMessage()
  .setDirectExchange('notifications')
  .setExchangeRoutingKey('welcome.email') // Must match exactly
  .setBody({ to: 'user@example.com' });
```

Routing keys are normalized to lowercase when stored, so `'Welcome.Email'` and `'welcome.email'` are the same key.

### Topic Exchange

Routes using wildcard patterns:

- `*` matches exactly one dot-separated token
- `#` matches zero or more dot-separated tokens

```javascript
const { RedisSMQ, EExchangeQueuePolicy } = require('redis-smq');

const topicExchange = RedisSMQ.createTopicExchange();
await topicExchange.create('events', EExchangeQueuePolicy.STANDARD);

// Bind queues with patterns
await topicExchange.bindQueue('audit-queue', 'events', 'user.*');
await topicExchange.bindQueue('alert-queue', 'events', '*.error.#');

// Send a message
const msg = RedisSMQ.newProducibleMessage()
  .setTopicExchange('events')
  .setExchangeRoutingKey('user.login.success')
  .setBody({ userId: 123 });
```

Binding patterns are stored verbatim — unlike direct routing keys, they are case-sensitive.

### Fanout Exchange

Broadcasts to all bound queues. No routing key needed.

```javascript
const { RedisSMQ, EExchangeQueuePolicy } = require('redis-smq');

const fanoutExchange = RedisSMQ.createFanoutExchange();
await fanoutExchange.create('alerts', EExchangeQueuePolicy.STANDARD);

// Bind multiple queues
await fanoutExchange.bindQueue('email-service', 'alerts');
await fanoutExchange.bindQueue('sms-service', 'alerts');
await fanoutExchange.bindQueue('push-service', 'alerts');

// Send once, delivers to all
const msg = RedisSMQ.newProducibleMessage()
  .setFanoutExchange('alerts')
  .setBody({ message: 'System update in 5 minutes' });
```

A fanout exchange has no routing keys. Supplying a routing key when producing through a fanout exchange rejects with `InvalidFanoutExchangeParametersError`.

## Direct to Queue (No Exchange)

The fastest path. Skip the exchange and send directly to a queue:

```javascript
const msg = RedisSMQ.newProducibleMessage()
  .setQueue('orders') // Direct delivery
  .setBody({ orderId: 123 });
```

Use this when you know the destination queue and don't need routing flexibility.

## Managing Exchanges

### Create, Inspect, Delete

```javascript
const { RedisSMQ, EExchangeQueuePolicy, EExchangeType } = require('redis-smq');

const mgr = RedisSMQ.createExchangeManager();

// Create an exchange with an explicit type and queue policy.
// The type and policy are fixed at creation and cannot change.
await mgr.create('orders', EExchangeType.DIRECT, EExchangeQueuePolicy.STANDARD);

// Inspect
const props = await mgr.getProperties('orders');
console.log('Type:', props.type, 'Policy:', props.queuePolicy);

const exists = await mgr.exists('orders');

// Delete — fails with ExchangeHasBoundQueuesError if any queue is
// still bound. Unbind every queue first.
await mgr.delete('orders');
```

The three facades (`createDirectExchange()`, `createTopicExchange()`, `createFanoutExchange()`) provide the same operations without a type parameter; use them when the type is known at compile time.

The `queuePolicy` argument is `EExchangeQueuePolicy.STANDARD` (accepts FIFO and LIFO queues) or `EExchangeQueuePolicy.PRIORITY` (accepts PRIORITY_QUEUE queues). Binding a queue whose type does not match the exchange's policy rejects with `ExchangeQueuePolicyMismatchError`.

### List Bindings

```javascript
// Routing keys for a direct exchange
const keys = await directExchange.getRoutingKeys('orders');

// Queues bound to a specific routing key
const queues = await directExchange.getRoutingKeyBoundQueues(
  'orders',
  'order.created',
);

// All bindings: { routingKey: [queues], ... }
const bindings = await directExchange.getBindings('orders');

// For a fanout exchange, bindings are a flat array of queues
const fanoutQueues = await fanoutExchange.getBindings('alerts');

// For a topic exchange, patterns map to bound queues
const patterns = await topicExchange.getBindings('events');
```

### Unbind Queues

```javascript
await directExchange.unbindQueue(
  'email-queue',
  'notifications',
  'welcome.email',
);
await fanoutExchange.unbindQueue('sms-service', 'alerts');
await topicExchange.unbindQueue('audit-queue', 'events', 'user.*');
```

Unbinding a queue that is not bound under the given key rejects with `QueueNotBoundError`.

## Delivery Models

### Point-to-Point

Each message goes to exactly one consumer:

```javascript
const { EQueueType, EQueueDeliveryModel } = require('redis-smq');

await queueManager.save(
  'tasks',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
);

// No group needed
await consumer.consume('tasks', (message, done) => {
  // Only one consumer processes this message
  done();
});
```

### Pub/Sub

Messages broadcast to all consumer groups:

```javascript
const { EQueueType, EQueueDeliveryModel } = require('redis-smq');

await queueManager.save(
  'notifications',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.PUB_SUB,
);

// Create consumer groups
const consumerGroups = RedisSMQ.createConsumerGroupsManager();
await consumerGroups.saveConsumerGroup('notifications', 'email-service');
await consumerGroups.saveConsumerGroup('notifications', 'sms-service');

// Each group consumes independently
await consumer.consume(
  {
    queueParams: { name: 'notifications', ns: 'default' },
    groupId: 'email-service',
  },
  handler,
);
await consumer.consume(
  {
    queueParams: { name: 'notifications', ns: 'default' },
    groupId: 'sms-service',
  },
  handler,
);
```

The group ID must be nested inside a `queueParams` wrapper — a bare `{ queue, groupId }` object is not a valid queue argument.

If a consumer subscribes to a Pub/Sub queue without a group ID, the library generates an ephemeral group for that consumer automatically. See [Consumer Groups](consumer-groups.md).

## Common Patterns

### Task Processing + Event Broadcasting

```
One exchange, two queues, two delivery models
orders.worker (Point-to-Point) → one worker processes
orders.events (Pub/Sub)        → all services notified
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

1. Create queues with their delivery models
2. Create each exchange with an explicit type and queue policy
3. Bind queues to exchanges
4. Create consumer groups for Pub/Sub queues
5. Start producing and consuming

## Best Practices

- **Use direct-to-queue** for simple cases — it skips a Redis round-trip per publish
- **Create exchanges before binding** — the current release requires explicit creation
- **Combine patterns** — one exchange can route to queues with different delivery models
- **Plan consumer groups** — one group per service or function
- **Handle `NoMatchingQueuesError`** — an existing exchange with no bound queues rejects produce with this error, distinct from a missing exchange which rejects with `ExchangeNotFoundError`
- **Set up bindings at startup** — configure routing before sending messages

## Related

- [Message Exchanges](https://github.com/weyoss/redis-smq-docs) — Exchange concepts
- [Queue Delivery Models](https://github.com/weyoss/redis-smq-docs) — Point-to-Point vs Pub/Sub
- [Producing Messages](producing-messages.md) — How to send messages
- [Consuming Messages](consuming-messages.md) — How to receive messages
- [Consumer Groups](consumer-groups.md) — Pub/Sub group lifecycle
