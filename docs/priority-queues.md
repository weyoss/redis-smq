# Priority Queues

Starting with version 3.3.0, reliable priority queues are supported.

By default, messages are produced and consumed from a `LIFO queue`. In a `LIFO queue` newer queue messages are always 
delivered first, before earlier messages. `LIFO queues` use [brpoplpush](https://redis.io/commands/brpoplpush) which 
blocks the connection until a message is received. `LIFO queues` can be used in most use cases where delivery priority 
of the queue messages is not critical to the operation of the application.

When `Priority queues` are enabled, messages with higher priority are always delivered first before messages with lower priority. 
`Priority queues` use pooling and lua scripting, which introduce a little of overhead on the MQ and 
therefore `priority queues` are less performant than `LIFO queues`. 

## Usage

To set up a message priority, the [Message API](/docs/api/message.md) provides the following methods:

* [setPriority()](api/message.md#messageprototypesetpriority)
* [getPriority()](api/message.md#messageprototypegetpriority)

See [Message Priority](api/message.md#messagemessagepriority) for more details.

***Producing messages with different priorities***

Priority messages can be published the same way as normal messages (messages without a priority) using a producer.

```javascript
const {Message, Producer} = require('redis-smq');

const msg1 = new Message();
msg1.setPriority(Message.MessagePriority.HIGH).setQueue('test_queue');

const producer = new Producer();
producer.produce(msg1, (err) => {
    if (err) console.log(err);
    else console.log('Successfully produced')
});

const msg2 = new Message();
msg2.setPriority(Message.MessagePriority.LOWEST);
msg2.setQueue('another_queue');
producer.produce(msg2, (err) => {
    if (err) console.log(err);
    else console.log('Successfully produced')
});

```

***Consuming messages from a priority queue***

To consume priority messages, you need at least one consumer with `priority queuing` enabled for a given queue.
See [Consumer API Reference](/docs/api/consumer.md) for more details.

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

// The third parameter is set to true for enabling priority queuing 
const consumer = new TestQueueConsumer('test_queue', config, true);
consumer.run();
```

