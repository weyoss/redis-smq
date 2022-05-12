# Priority Queues

Starting with version 3.3.0, reliable priority queues are supported.

By default, messages are produced and consumed to/from a `LIFO queue`. In a `LIFO queue` newer queue messages are always delivered first, before earlier messages. 

`LIFO queues` use [brpoplpush](https://redis.io/commands/brpoplpush) which blocks the connection to the Redis server until a message is received. 

`LIFO queues` can be used in most use cases where delivery priority of the messages is not critical to the operation of your application.

When `Priority queues` are enabled, messages with higher priority are always delivered first before messages with lower priority. 

`Priority queues` use pooling and lua scripting, which introduce a little of overhead on the MQ and therefore `priority queues` are less performant than `LIFO queues`. 

## Usage

### Creating a Priority Queue

To create a priority queue use the [QueueManager.prototype.queue.create()](/docs/api/queue-manager.md#queuemanagerprototypequeuecreate) method.

```javascript
const { QueueManager } = require('redis-smq');

QueueManager.getSingletonInstance((err, queueManager) => {
  if (err) console.log(err);
  else queueManager.queue.create('test_queue', true, (err) => console.log(err));
})
```

### Setting Up a Message Priority

To set up a message priority, the [Message API](/docs/api/message.md) provides the following methods:

* [Message.prototype.setPriority()](api/message.md#messageprototypesetpriority)
* [Message.prototype.getPriority()](api/message.md#messageprototypegetpriority)

See [Message Priority](api/message.md#messagemessagepriority) for more details.

### Producing Messages

Before producing a message with a priority, make sure that queue of the message is a priority queue. Otherwise, an error will be returned.

```javascript
const {Message, Producer} = require('redis-smq');

const msg1 = new Message();
msg1.setPriority(Message.MessagePriority.HIGH).setQueue('test_queue');

const producer = new Producer();
producer.produce(msg1, (err) => {
    if (err) console.log(err);
    else console.log('Successfully produced')
});
```

### Consuming Messages

Consuming messages from a priority queue works as usually without any extra settings.

```javascript
'use strict';
const { Consumer } = require('redis-smq');

const consumer = new Consumer();
consumer.consume('test_queue', (msg, cb) => cb(), (err, isRunning) => {
  if (err) console.log(error);
  else console.log(`Message handler successfully registered. Currently it is ${isRunning? '': 'not '}running.`);
})
consumer.run();
```

