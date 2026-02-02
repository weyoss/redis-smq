[RedisSMQ](../README.md) / [Docs](README.md) / Queues

# Queues

Queues store messages until consumers process them. RedisSMQ offers three queue types with different behaviors.

## Queue Types

### 1. FIFO (First In, First Out)

![RedisSMQ FIFO Queuing](redis-smq-fifo-queuing.png)

Messages processed in the order they arrive.

```javascript
queueManager.save(
  'tasks',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err) => {
    if (err) console.error('Failed:', err);
    else console.log('FIFO queue created');
  },
);
```

**Best for**: Order processing, job queues, sequential workflows.

### 2. LIFO (Last In, First Out)

![RedisSMQ LIFO Queuing](redis-smq-lifo-queuing.png)

Most recent messages processed first.

```javascript
queueManager.save(
  'logs',
  EQueueType.LIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  callback,
);
```

**Best for**: Real-time updates, latest-first processing.

### 3. Priority Queue

![RedisSMQ Priority Queuing](redis-smq-priority-queuing.png)

Messages processed by priority level (0-7).

```javascript
queueManager.save(
  'alerts',
  EQueueType.PRIORITY_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  callback,
);
```

Set priority on messages:

```javascript
const msg = new ProducibleMessage()
  .setQueue('alerts')
  .setPriority(EMessagePriority.HIGH) // 0-7 scale
  .setBody({ alert: 'Urgent!' });
```

**Priority Levels**:

- `LOWEST` (7) - Lowest priority
- `VERY_LOW` (6)
- `LOW` (5)
- `NORMAL` (4)
- `ABOVE_NORMAL` (3)
- `HIGH` (2)
- `VERY_HIGH` (1)
- `HIGHEST` (0) - Highest priority

## Performance Comparison

| Queue Type    | Speed                       | Best Use              |
| ------------- | --------------------------- | --------------------- |
| **FIFO/LIFO** | 🚀 Fastest                  | High throughput       |
| **Priority**  | 🐢 Slower (30-50% overhead) | Need message ordering |

## Queue Names

### Valid Names

```text
✅ 'orders'
✅ 'email-queue'
✅ 'user_events'
✅ 'app.notifications'
✅ 'queue-123'
```

### Invalid Names

```text
❌ '3queue'          // Can't start with number
❌ 'my queue'        // No spaces
❌ 'queue$'          // No special chars
❌ 'my-queue-'       // Can't end with hyphen
```

### Namespacing

Organize queues by environment or app:

```text
// Production queues
{ ns: 'prod', name: 'orders' }

// Development queues
{ ns: 'dev', name: 'orders' }

// Default namespace (from config)
'orders'  // Uses default namespace
```

## Managing Queues

### Create Queue Manager

```javascript
const queueManager = RedisSMQ.createQueueManager();
```

### List All Queues

```javascript
queueManager.getQueues((err, queues) => {
  console.log('Queues:', queues);
});
```

### Delete a Queue

```javascript
queueManager.delete('old-queue', (err) => {
  if (err) console.error('Failed:', err);
  else console.log('Queue deleted');
});
```

### Check Queue Exists

```javascript
queueManager.exists('my-queue', (err, exists) => {
  console.log('Queue exists:', exists);
});
```

## Message Management

### Different Message Types

```javascript
// All messages in queue
const allMessages = RedisSMQ.createQueueMessages();

// Waiting to be processed
const pendingMessages = RedisSMQ.createQueuePendingMessages();

// Successfully processed (requires audit enabled)
const acknowledgedMessages = RedisSMQ.createQueueAcknowledgedMessages();

// Failed messages (requires audit enabled)
const deadLetteredMessages = RedisSMQ.createQueueDeadLetteredMessages();

// Scheduled for future delivery
const scheduledMessages = RedisSMQ.createQueueScheduledMessages();
```

### Example: Count Pending Messages

```javascript
pendingMessages.countMessages('orders', (err, count) => {
  console.log(`Pending orders: ${count}`);
});
```

## Delivery Models

Each queue can use either:

### Point-to-Point

One consumer per message.

```javascript
EQueueDeliveryModel.POINT_TO_POINT;
```

### Pub/Sub

Broadcast to consumer groups.

```javascript
EQueueDeliveryModel.PUB_SUB;
```

## Best Practices

### 1. Choose the Right Queue Type

- **FIFO**: Job processing, ordered tasks
- **LIFO**: Real-time updates, latest data first
- **Priority**: Critical alerts, VIP users

### 2. Use Meaningful Names

```javascript
// ✅ Clear hierarchy
'app.notifications.email';
'orders.processing.payment';

// ❌ Unclear
'queue1';
'data2';
'temp';
```

### 3. Monitor Queue Health

```javascript
// Regular checks
pendingMessages.countMessages('critical-queue', (err, count) => {
  if (count > 1000) {
    console.warn('Queue backing up!');
  }
});
```

### 4. Clean Up Unused Queues

```javascript
// Remove old test queues
queueManager.delete('test-queue-2024', callback);
```

## Example: Complete Setup

```javascript
const { RedisSMQ, EQueueType, EQueueDeliveryModel } = require('redis-smq');

// Create queue manager
const queueManager = RedisSMQ.createQueueManager();

async.series(
  [
    // Create different queue types
    (next) =>
      queueManager.save(
        'orders',
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.POINT_TO_POINT,
        next,
      ),
    (next) =>
      queueManager.save(
        'alerts',
        EQueueType.PRIORITY_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
        next,
      ),
    (next) =>
      queueManager.save(
        'logs',
        EQueueType.LIFO_QUEUE,
        EQueueDeliveryModel.POINT_TO_POINT,
        next,
      ),
  ],
  () => {
    // List all queues
    queueManager.getQueues((err, queues) => {
      console.log(
        'Available queues:',
        queues.map((q) => q.name),
      );
    });
  },
);
```

---

**Related**:

- [QueueManager API](api/classes/QueueManager.md) - Complete queue management
- [Producing Messages](producing-messages.md) - How to send to queues
- [Consuming Messages](consuming-messages.md) - How to receive from queues
- [Queue Delivery Models](queue-delivery-models.md) - Point-to-Point vs Pub/Sub
- [Configuration](configuration.md) - Namespace setup
