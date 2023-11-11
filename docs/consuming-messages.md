[RedisSMQ](../README.md) / [Docs](README.md) / Consuming Messages

# Consuming Messages

A `Consumer` instance can be used to receive and consume messages from one or multiple queues.

To consume messages from a queue, the [Consumer Class](api/classes/Consumer.md) class provides the 
[consume()](api/classes/Consumer.md#consume) method which allows to register a `message handler`.

A `message handler` is a function that receives a delivered message from a given queue.

Message handlers can be registered at any time, before or after a consumer has been started.

In contrast to producers, consumers are not automatically started upon creation. To start a consumer use the [run()](api/classes/Consumer.md#run) method.

To stop consuming messages from a queue and to remove the associated `message handler` from your consumer, use the [cancel()](api/classes/Consumer.md#cancel) method.

To shut down completely your consumer and tear down all message handlers, use the 
[shutdown()](api/classes/Consumer.md#shutdown) method.

```javascript
'use strict';

const { Consumer } = require('redis-smq');

const consumer = new Consumer();

const messageHandler = (msg, cb) => {
   const payload = msg.getBody();
   console.log('Message payload', payload);
   cb(); // acknowledging the message
};

consumer.consume('test_queue', messageHandler, (err) => {
   if (err) console.error(err);
});

consumer.run();
```

## Message Acknowledgement

Once a message is received, to acknowledge it, you invoke the callback function without arguments, as shown in the example above.

Message acknowledgment informs the MQ that the delivered message has been successfully consumed.

If an error occurred while processing a message, you can unacknowledge it by passing in the error to the callback function.

By default, unacknowledged messages are re-queued and delivered again unless **message retry threshold** is exceeded.

Delivered messages that couldn't be processed or can not be delivered to consumers are moved to a system generated queue called **dead-letter queue (DLQ)**.

By default, RedisSMQ does not store acknowledged and dead-lettered messages for saving disk and memory spaces, and also to increase message processing performance.

If you need such feature, you can enable it from your [configuration](configuration.md) object.

See [Consumer Class](api/classes/Consumer.md) for more details.
