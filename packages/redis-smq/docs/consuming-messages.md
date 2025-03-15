[RedisSMQ](../README.md) / [Docs](README.md) / Consuming Messages

# Consuming Messages

The [Consumer](api/classes/Consumer.md) instance enables you to receive and process messages from one or more queues in
the RedisSMQ.

## Setting Up a Consumer

To consume messages from a specific queue, use the [Consumer Class](api/classes/Consumer.md), which includes the [Consumer.consume()](api/classes/Consumer.md#consume)
method to register a message handler.

### What is a Message Handler?

A message handler is a callback function you define that receives the delivered message from the specified queue.
You can register message handlers at any point — before or after the consumer has started.

**Important Note:** Unlike producers, consumers do not automatically start upon creation. You must explicitly start a
consumer using the [Consumer.run()](api/classes/Consumer.md#run) method.

## Consuming Messages

To stop consuming messages from a queue and remove the related message handler, you can invoke the [Consumer.cancel()](api/classes/Consumer.md#cancel)
method. To fully shut down the consumer and dismantle all message handlers, use the [Consumer.shutdown()](api/classes/Consumer.md#shutdown) method.

### Example: Registering a Message Handler

Here's a basic example demonstrating how to set up a consumer and register a message handler:

```javascript
'use strict';

const { Consumer } = require('redis-smq');

const consumer = new Consumer();

const messageHandler = (msg, cb) => {
  console.log('Message payload:', msg.body);
  cb(); // Acknowledge the message
};

consumer.consume('test_queue', messageHandler, (err) => {
  if (err) console.error(err);
});

// Start the consumer
consumer.run((err) => {
  if (err) console.error(err);
});
```

### Alternative Approach: Registering After Starting

You can also register a message handler after the consumer has been started:

```javascript
'use strict';

const { Consumer } = require('redis-smq');

const consumer = new Consumer();

consumer.run((err) => {
  if (err) console.error(err);
  else {
    const messageHandler = (msg, cb) => {
      console.log('Message payload:', msg.body);
      cb(); // Acknowledge the message
    };
    consumer.consume('test_queue', messageHandler, (err) => {
      if (err) console.error(err);
    });
  }
});
```

## Message Acknowledgement

Upon receiving a message, acknowledge it by invoking the callback without arguments, as shown in the examples above.
Acknowledgment signals to the message queue that the message has been successfully processed.

If an error occurs while processing a message, you can inform the message queue of the failure by passing the error to
the callback function. By default, unacknowledged messages are re-queued and delivered again unless they exceed the
defined message retry threshold.

Any messages that cannot be processed or delivered to consumers are moved to a system-generated queue known as the
dead-letter queue (DLQ).

### Note on Message Storage

Redis-SMQ does not store acknowledged or dead-lettered messages by default. This design decision helps conserve disk
and memory space and improves message processing performance. If you require storage for acknowledged or dead-lettered
messages, you can enable this feature in your [configuration](configuration.md) object.

For more in-depth information, refer to the [Consumer Class](api/classes/Consumer.md) documentation.
