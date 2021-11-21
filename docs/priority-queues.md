# Priority Queues

Starting with version 3.3.0, reliable priority queues are supported. 

A consumer, or a producer, can be configured to work whether on a `LIFO (last-in, first-out) MQ` or a `Priority MQ`.

In a `LIFO queue`, newer queue messages are always delivered first, before earlier messages. `LIFO queues` use 
[brpoplpush](https://redis.io/commands/brpoplpush) which blocks the connection until a message is received. `LIFO queues`
can be used in most use cases where delivery priority of the queue messages is not critical to the operation of 
the application.

When using `Priority queues`, messages with higher priority are always delivered first before messages with lower priority. 
`Priority queues` use pooling and lua scripting, which introduce a little of overhead on the MQ and 
therefore `priority queues` are less performant than `LIFO queues`. 

It is recommended to use the MQ as a `Priority MQ` only when you really need such queue.

When not configured, RedisSMQ is a `LIFO MQ`. 

**Note**: `LIFO queues` and `Priority queues` can coexist together. For example, we can have a `Priority queue`, named `emails`, 
for sending emails with priority. At the same time, we can have also a `LIFO queue`, named `image_resize`, for 
creating thumbnails from user submitted images. Both the former and the latter 
queues can have as many consumers and producers as possible without any restrictions as far as the consumers and 
the producers are correctly configured.

## Configuration

```javascript
'use strict';

module.exports = {
    priorityQueue: true,
};
```

**Parameters**

- `priorityQueue` *(Boolean): Optional.* When `true`, the MQ will use priority queues instead of `LIFO queues`.

## Usage

To use `priority queues` you should first enable priority queuing. Otherwise, message priority, even when set, will be simply ignored.

The message API provides the following methods:

* [setPriority()](api/message.md#messageprototypesetpriority)
* [getPriority()](api/message.md#messageprototypegetpriority)

in order to set up and retrieve the message priority. See [Message Priority](api/message.md#messagemessagepriority) for more details.

When message priority is not set, the message is produced with a `Message.MessagePriority.NORMAL` priority.

***Producing messages with different priorities***

```javascript
const { Message, Producer } = require('redis-smq');
const config = require('./config');

const msg1 = new Message();
msg1.setPriority(Message.MessagePriority.HIGH);

const producer = new Producer('test_queue', config);
producer.produceMessage(msg1, (err) => {
    if (err) console.log(err);
    else console.log('Successfully produced')
});

const msg2 = new Message();
msg2.setPriority(Message.MessagePriority.LOWEST);
producer.produceMessage(msg2, (err) => {
    if (err) console.log(err);
    else console.log('Successfully produced')
});

```

***Consuming messages from a priority queue***

Message from priority queues are consumed as usually without any exception.

```javascript
'use strict';

const { Consumer } = require('redis-smq');
const config = require('./config');

class TestQueueConsumer extends Consumer {
    consume(message, cb) {
        console.log('Got a message to consume:', message);
        cb();
    }
}

const consumer = new TestQueueConsumer('test_queue', config);
consumer.run();
```