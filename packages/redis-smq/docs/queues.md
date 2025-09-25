[RedisSMQ](../README.md) / [Docs](README.md) / Queues

# Queues

In RedisSMQ, a queue plays a crucial role in managing messages produced by producers and consumed by consumers.
The system supports three distinct types of queues: **LIFO (Last In, First Out)**, **FIFO (First In, First Out)**, and
**Priority queues**.

## Reliability

All RedisSMQ queue types are designed to be **reliable**. Reliability ensures that messages are not lost, even in the
event of failures, such as a consumer crash. The system can recover from failure scenarios, maintaining message
integrity throughout the process.

## Queue Mechanics

In a typical LIFO or FIFO queue setup, RedisSMQ uses the [brpoplpush](https://redis.io/commands/brpoplpush) command to
block the connection to the Redis server until a message is available. Conversely, priority queues employ pooling and
Lua scripting, which may introduce additional overhead and result in slightly reduced performance compared to LIFO and
FIFO queues.

For simplicity in the upcoming examples, we will utilize the `EQueueDeliveryModel.POINT_TO_POINT` delivery model across
all queue types. However, you can customize your application by choosing any combination of `EQueueType` and
`EQueueDeliveryModel` that suits your needs.

## LIFO (Last In, First Out) Queues

![RedisSMQ LIFO Queuing](redis-smq-lifo-queuing.png)

In a LIFO queue, the most recently published messages are delivered first, while the oldest messages are delivered last.

```javascript
const { Queue, EQueueType, EQueueDeliveryModel } = require('redis-smq');

const queue = new Queue();
queue.save(
  'my_queue',
  EQueueType.LIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err) => {
    if (err) console.error(err);
  },
);
```

For additional details, please refer to the [QueueManager.save()](api/classes/QueueManager.md#save) documentation.

## FIFO (First In, First Out) Queues

![RedisSMQ FIFO Queuing](redis-smq-fifo-queuing.png)

In a FIFO queue, messages are processed in the order they are received: the first published messages are delivered
first, followed by later entries.

```javascript
const { Queue, EQueueType, EQueueDeliveryModel } = require('redis-smq');

const queue = new Queue();
queue.save(
  'my_queue',
  EQueueType.FIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err) => {
    if (err) console.error(err);
  },
);
```

Refer to [QueueManager.save()](api/classes/QueueManager.md#save) for more information.

## Priority Queues

![RedisSMQ Priority Queuing](redis-smq-priority-queuing.png)

Priority queues deliver messages based on their assigned priority, ensuring that those with higher priority are
processed before lower-priority messages.

```javascript
const { Queue, EQueueType, EQueueDeliveryModel } = require('redis-smq');

const queue = new Queue();
queue.save(
  'my_queue',
  EQueueType.PRIORITY_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err) => {
    if (err) console.error(err);
  },
);
```

For further details, consult [QueueManager.save()](api/classes/QueueManager.md#save).

### Setting Up Message Priorities

To configure message priorities within your application, the [ProducibleMessage Class](api/classes/ProducibleMessage.md)
offers the following methods:

- [ProducibleMessage.setPriority()](api/classes/ProducibleMessage.md#setpriority)
- [ProducibleMessage.getPriority()](api/classes/ProducibleMessage.md#getpriority)

Valid priority values include:

- `EMessagePriority.LOWEST`
- `EMessagePriority.VERY_LOW`
- `EMessagePriority.LOW`
- `EMessagePriority.NORMAL`
- `EMessagePriority.ABOVE_NORMAL`
- `EMessagePriority.HIGH`
- `EMessagePriority.VERY_HIGH`
- `EMessagePriority.HIGHEST`

Please refer to the [EMessagePriority](api/enumerations/EMessagePriority.md) documentation for more information.

## Queue Namespacing

RedisSMQ uses namespacing to manage queues effectively. Each namespace acts as a scope, ensuring unique queue names and
preventing **name collisions** across multiple queues that may share the same name.

A queue can be identified by its name (e.g., `orders`) or by its name and namespace
(e.g., `{ ns: 'my-app', name: 'orders' }`). If no namespace is specified, the queue defaults to the **default**
namespace. This default can be configured through your configuration object. For more details,
see [Configuration](configuration.md).

## Queue Naming Requirements

Queue names must adhere to the following criteria:

- Composed solely of alphanumeric characters `[a-z0-9]` (e.g., `queue$` is invalid).
- May include `-` and `_` characters (e.g., `my-queue` and `my_queue` are valid).
- Must start with an alphabetic character `[a-z]` and end with an alphanumeric character `[a-z0-9]` (e.g., `3queue` and
  `my_queue_` are invalid).
- Can include dots (`.`) for hierarchical naming (e.g., `sports.football`). Refer
  to [Topic Exchange](message-exchanges.md#2-topic-exchange) for further details.

## Managing Queues and Namespaces

RedisSMQ provides the following classes for effective queue and namespace management:

- [NamespaceManager Class](api/classes/NamespaceManager.md)
- [QueueManager Class](api/classes/QueueManager.md)

## Managing Queue Messages

For queue message management, utilize the following classes:

- [QueueMessages Class](api/classes/QueueMessages.md)
- [QueuePendingMessages Class](api/classes/QueuePendingMessages.md)
- [QueueAcknowledgedMessages Class](api/classes/QueueAcknowledgedMessages.md)
- [QueueDeadLetteredMessages Class](api/classes/QueueDeadLetteredMessages.md)
- [QueueScheduledMessages Class](api/classes/QueueScheduledMessages.md)

Please note that by default, acknowledged messages and dead-lettered messages are not saved. To enable storage for
acknowledged and dead-lettered messages, you must configure your [RedisSMQ Configuration](configuration.md) accordingly.
