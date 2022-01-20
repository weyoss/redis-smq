# Migrating from RedisSMQ v5.x.x to v6.x.x

> Before upgrading, you should make a backup or finish processing your messages in case you have if you any important data.

To avoid conflicts and to prevent data lost, the Redis keys "version" has been bumped up. So your existing 
data would not be touched.

Upgrading your installation to the newest version should be straightforward as most APIs are compatible, with some
exceptions:

**1. Publishing a message**

Before:

```javascript
const producer = new MyProducer('test_queue', config);

const msg = new Message();
msg.setPriority(Message.MessagePriority.HIGHEST).setBody('Some data');
producer.produceMessage(msg, () => {
    // The message priority will be ignored as priority queuing for the given producer is not enabled.
    // ...
});

//OR
producer.produceMessage('Some data', () => {
  // The message priority will be ignored as priority queuing for the given producer is not enabled.
  // ...
});
```

Now:

```javascript
const producer = new MyProducer(config);

const msg = new Message();
msg
    .setPriority(Message.MessagePriority.HIGHEST)
    .setBody('Some data')
    .setQueue('test_queue');
producer.produce(msg, () => {
  // ...
});
```

Using the same producer instance, you can now produce multiple messages to different queues. Do not forget to set up 
the message queue (`setQueue()`). Otherwise, an error will be returned.

**2. Publishing priority messages**

From a single producer instance you are now able to publish priority messages and non-priority messages, without the
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
const producer = new MyProducer();

const msg = new Message();
msg
  .setPriority(Message.MessagePriority.HIGHEST)
  .setBody('Some data')
  .setQueue('test_queue');
producer.produce(msg, () => {
    // As the message priority has been set, the message will be published using priority queuing
    // ...
});

const anotherMsg = new Message();
msg.setBody('payload').setQueue('another_queue');
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

**6. Refactored MessageManager API**

Refactoring includes: 
- Method renaming
- Method signature changes
- New methods migrated from QueueManager

See [MessageManager API](/docs/api/message-manager.md) and [QueueManager API](/docs/api/queue-manager.md) for more details.

**6. Refactored QueueManager API**

Refactoring includes:
- Method renaming
- Method signature changes
- Some methods have been migrated to MessageManager

See [MessageManager API](/docs/api/message-manager.md) and [QueueManager API](/docs/api/queue-manager.md) for more details.

**7. Updated HTTP API endpoints**

See [HTTP API Reference](http-api.md) for more details.