[RedisSMQ](../README.md) / [Docs](README.md) / Producing Messages

# Producing Messages

The `Producer` class provides the functionality to publish messages to a queue efficiently.

You can utilize a single `Producer` instance to send messages—including those with priority—to one or more queues
simultaneously.

### Important Note

Before publishing a message, ensure that you specify an exchange for the message using one of the following methods:

- [ProducibleMessage.setQueue()](api/classes/ProducibleMessage.md#setqueue)
- [ProducibleMessage.setTopic()](api/classes/ProducibleMessage.md#settopic)
- [ProducibleMessage.setFanOut()](api/classes/ProducibleMessage.md#setfanout)

Failure to set an exchange will result in an error.

### Example Code

Here's a simple example of how to use the `Producer` to send a message:

```javascript
'use strict';
const { ProducibleMessage, Producer } = require('redis-smq');

const producer = new Producer();

// Start the producer before publishing a message
producer.run((err) => {
  if (err) {
    console.error('Error starting producer:', err);
  } else {
    const msg = new ProducibleMessage();
    msg
      .setBody({ hello: 'world' }) // Set the message body
      .setTTL(3600000) // Set message expiration time in milliseconds
      .setQueue('test_queue'); // Specify the queue for the message

    producer.produce(msg, (err, reply) => {
      if (err) {
        console.error('Error producing message:', err);
      } else {
        console.log('Successfully produced message:', reply);
      }
    });
  }
});
```

### Further Reading

For more information, check out the following resources:

- [Message Exchanges](message-exchanges.md)
- [Producer Class Documentation](api/classes/Producer.md)

This will help you understand message routing and the capabilities of the producer class in depth.
