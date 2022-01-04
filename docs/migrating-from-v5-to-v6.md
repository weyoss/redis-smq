# Migrating from RedisSMQ v5.x.x to v6.x.x

> Before upgrading, you should make a backup or finish processing your messages in case you have if you any important data.

To avoid conflicts and to prevent data lost, the Redis keys "version" has been bumped up. So your existing 
data would not be touched.

Upgrading your installation to the newest version should be straightforward as most APIs are compatible, with some
exceptions:


**1. Publishing a message**

To publish a message, use the `produce()` method of your producer (`produceMessage()` has been renamed).

**2. Publishing priority messages**

From single producer instance you are now able to publish priority messages and non-priority messages, without the
need to create a separate producer with priority queuing enabled for priority messages.

**3. Priority queuing**

When setting up a priority for a given message, `priority queuing` for the message will be
enabled, and the message will be published to its priority queue (you don't need anymore to enable priority queuing in
your configuration object).

**4. Configuration**

Removed `priorityQueue` parameter from the configuration parameters.

Before: 

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
```

Now:

```javascript
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

**5. Consuming priority messages**

To consume messages with priority, you should enable priority queuing for a given consumer instance.
See [Consumer Reference API](/docs/api/consumer.md#consumerprototypeconstructor) for more details.

Before:

```javascript
// Before
const config = {
    // ...
    priorityQueue: true,
}
const consumer = new MyConsumer('test_queue', config);
```

Now:

```javascript
// Priority queuing is enabled for MyConsumer instance using the third constructor argument
const consumer = new MyConsumer('test_queue', config, true);
```

**6. MessageManager and QueueManager API**

For MessageManager and QueueManager, methods that accept `queue name` and `namespace` are now accepting a
single argument which can be either a `queue name` (string) or an object holding the `queue name` and `namespace`.

Before:

```javascript
getPendingMessages(queueName, ns, skip, take, cb);
```

Now:

```javascript
// Argument [queue] can be of a string type like 'test_queue' or an object like { name: 'test_queue', ns: 'testing' } 
// When queue is of a string type the default namespace will be used.
getPendingMessages(queue, skip, take, cb);
```

See [MessageManager API](/docs/api/message-manager.md) and [QueueManager API](/docs/api/queue-manager.md) for more details.

**7. MessageManager.prototype.requeueMessageFromAcknowledgedQueue()**

`MessageManager.prototype.requeueMessageFromAcknowledgedQueue()` now accepts 5 arguments.

Before:

```javascript
requeueMessageFromAcknowledgedQueue(queue, sequenceId, messageId, withPriority, priority, cb)
```

Now:

```javascript
// When requeuing a message with priority, the priority argument should not be empty. Otherwise, set its value 
// to undefined.
requeueMessageFromAcknowledgedQueue(queue, sequenceId, messageId, priority, cb)
```

**8. MessageManager.prototype.requeueMessageFromDLQueue()**

`MessageManager.prototype.requeueMessageFromDLQueue()` now accepts 5 arguments.

Before:

```javascript
requeueMessageFromDLQueue(queue, sequenceId, messageId, withPriority, priority, cb)
```

Now:

```javascript
// When requeuing a message with priority, the priority argument should not be empty. Otherwise, set its value 
// to undefined.
requeueMessageFromDLQueue(queue, sequenceId, messageId, priority, cb)
```