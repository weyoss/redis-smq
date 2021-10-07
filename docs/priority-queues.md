# Priority Queues

Starting with version 3.3.0, reliable priority queues are supported. 

By design, a consumer/producer pair can be configured to be use either a `FIFO (first-in, first-out) MQ` or a `Priority MQ`.

Using `FIFO queues`, consumers receive messages in the same order that they were published to the MQ. `FIFO queues` use 
[brpoplpush](https://redis.io/commands/brpoplpush) which blocks the connection until a message is received.

When using `Priority queues`, messages with higher priority are always consumed first before messages with lower priority. 
`Priority queues` use pooling and lua scripting, which introduce a little of overhead on the Redis server and 
therefore `priority queues` are less performant than `FIFO queues`.

For this reason, by default, RedisSMQ is a FIFO MQ.

## Configuration

```javascript
'use strict';

module.exports = {
    priorityQueue: true,
};
```

**Parameters**

- `priorityQueue` *(Boolean): Optional.* When `true`, the MQ will use priority queues instead of FIFO queues.

## Usage

To use `priority queues` you should first enable priority queuing. Otherwise, message priority, even when set, will be simply ignored.

The message API provides the following methods:

* [setPriority()](api/message.md#messageprototypesetpriority)
* [getPriority()](api/message.md#messageprototypegetpriority)

in order to set up and retrieve the message priority. See [Message Priority](api/message.md#messagemessagepriority) for more details.

When message priority is not set, the message is produced with a `Message.MessagePriority.NORMAL` priority.

Sure, a `Priority MQ` can be used as a FIFO MQ, if all the messages have the same priority. But then, why should you 
use a `Priority MQ` as a `FIFO MQ` considering the overhead (not a significant overhead, but it matters) that it 
introduces on the MQ?

It is recommended to use the MQ as a `Priority MQ` only when you really need such feature.

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