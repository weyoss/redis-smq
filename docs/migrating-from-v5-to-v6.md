# Migrating from RedisSMQ v5.x.x to v6.x.x

Before upgrading, if your have any important data (messages) existing in the MQ, you should first make a backup or finish your data 
processing.

To avoid conflicts, and to prevent loosing your data, the Redis keys "version" has been bumped up. So your existing 
data would not be touched.

Upgrading your installation to the newest version should be straightforward as most APIs are compatible, with some
exceptions:

- To publish a message, use the `produce()` method of your producer (`produceMessage()` has been renamed).

- A producer is now able to publish priority messages and non-priority messages, without the need to create a 
separate producer with priority queuing enabled for priority messages.

- When setting up a priority for a given message, `priority queuing` for the message will be 
enabled, and the message will be published to its priority queue.

- Removed `priorityQueue` parameter from the configuration parameters.

```javascript
// Before
const config = {
    namespace: 'my-namespace',
    priorityQueue: false,
}

const producer = new MyProducer('test_queue', config);

const msg = new Message();
msg.setPriority(Message.MessagePriority.HIGHEST);
producer.produceMessage(msg, () => {
    // The message priority will be ignored as priority queuing for the given producer is not enabled.
    // ...
});

// Now
const config = {
    namespace: 'my-namespace',
    // priorityQueue has been removed from the configuration object
    // priorityQueue: false, 
}

// Using this Producer instance we can publish priority and non-priority messages
const producer = new MyProducer('test_queue');

const msg = new Message();
msg.setPriority(Message.MessagePriority.HIGHEST);
msg.setBody('Some data');
producer.produce(msg, () => {
    // As the message priority has been set, the message will be published using priority queuing
    // ...
});

const anotherMsg = new Message();
msg.setBody('payload');
producer.produce(anotherMsg, () => {
    // The message has been published without priority queuing 
    // ...
});
```

- To consume messages with priority, you should enable priority queuing for a given consumer instance. 
See [Consumer Reference API](/docs/api/consumer.md#consumerprototypeconstructor) for more details.

```javascript
// Before
const config = {
    // ...
    priorityQueue: true,
}
const consumer = new MyConsumer('test_queue', config);

// Now
// Priority queuing is enabled for MyConsumer instance using the third constructor argument
const consumer = new MyConsumer('test_queue', config, true);
```

- Updated MessageManager and QueueManager API: Methods that accepts `queue name` and `namespace` is now accepting a 
single argument with can be either a `queue name` or an object which holds the `queue name` and `namespace`.

```javascript
// Before 
getPendingMessages(queueName, ns, skip, take, cb);

// Now
// Argument [queue] can be of a string type like 'test_queue' or an object like { name: 'test_queue', ns: 'testing' } 
// When queue is of a string type the default namespace will be used.
getPendingMessages(queue, skip, take, cb);
```

See [MessageManager API](/docs/api/message-manager.md) and [QueueManager API](/docs/api/queue-manager.md) for more details.

- `MessageManager.prototype.requeueMessageFromAcknowledgedQueue()` now accepts 5 arguments:

```javascript
// Before
requeueMessageFromAcknowledgedQueue(queue, sequenceId, messageId, withPriority, priority, cb)

// Now
// When requeuing a message with priority, the priority argument should not be empty. Otherwise, set its value 
// to undefined.
requeueMessageFromAcknowledgedQueue(queue, sequenceId, messageId, priority, cb)
```

- `MessageManager.prototype.requeueMessageFromDLQueue();` now accepts 5 arguments:

```javascript
// Before
requeueMessageFromDLQueue(queue, sequenceId, messageId, withPriority, priority, cb)

// Now
// When requeuing a message with priority, the priority argument should not be empty. Otherwise, set its value 
// to undefined.
requeueMessageFromDLQueue(queue, sequenceId, messageId, priority, cb)
```
