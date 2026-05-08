# Queue Management

Create, inspect, and delete queues.

## Quick Start

```javascript
const { RedisSMQ, EQueueType, EQueueDeliveryModel } = require('redis-smq');
const queueManager = RedisSMQ.createQueueManager();
```

## Create a Queue

```javascript
queueManager.save(
  'orders',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err) => {
    if (err) console.error('Failed:', err);
    else console.log('Queue created');
  },
);
```

### Queue Types

| Type     | Constant                    | Description               |
| -------- | --------------------------- | ------------------------- |
| FIFO     | `EQueueType.FIFO_QUEUE`     | First in, first out       |
| LIFO     | `EQueueType.LIFO_QUEUE`     | Last in, first out        |
| Priority | `EQueueType.PRIORITY_QUEUE` | Ordered by priority level |

### Delivery Models

| Model          | Constant                             | Description                  |
| -------------- | ------------------------------------ | ---------------------------- |
| Point-to-Point | `EQueueDeliveryModel.POINT_TO_POINT` | One consumer per message     |
| Pub/Sub        | `EQueueDeliveryModel.PUB_SUB`        | Broadcast to consumer groups |

### With Namespace

```javascript
// Explicit namespace
queueManager.save(
  { ns: 'production', name: 'orders' },
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  callback,
);

// Default namespace (from configuration)
queueManager.save(
  'orders',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  callback,
);
```

## Inspect Queues

### Check if Exists

```javascript
queueManager.exists('orders', (err, exists) => {
  console.log('Exists:', exists);
});
```

### List All Queues

```javascript
queueManager.getQueues((err, queues) => {
  queues.forEach((q) => {
    console.log(`${q.name}@${q.ns}`);
  });
});
```

### Get Queue Properties

```javascript
queueManager.getProperties('orders', (err, props) => {
  console.log('Type:', props.queueType);
  console.log('Delivery model:', props.deliveryModel);
  console.log('Messages:', props.messagesCount);
  console.log('Pending:', props.pendingMessagesCount);
  console.log('State:', props.operationalState);
});
```

## Delete a Queue

```javascript
queueManager.delete('old-queue', (err) => {
  if (err) console.error('Failed:', err);
  else console.log('Queue deleted');
});
```

## Promise Style

```javascript
await queueManager.save(
  'orders',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
);
const exists = await queueManager.exists('orders');
const queues = await queueManager.getQueues();
await queueManager.delete('old-queue');
```

## Related

- [Queues Concepts](https://github.com/weyoss/redis-smq-docs) — Queue types and behavior
- [Queue Delivery Models](https://github.com/weyoss/redis-smq-docs) — Point-to-Point vs Pub/Sub
- [Queue State Management](queue-state-management.md) — Pause, resume, stop
- [Queue Rate Limiting](queue-rate-limiting.md) — Control throughput
