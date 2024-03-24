[RedisSMQ](../README.md) / [Docs](README.md) / Producing Messages

# Producing Messages

A `Producer` instance allows to publish a message to a queue.

You can use a single `Producer` instance to produce messages, including messages with priority, to one or multiple queues.

Before publishing a message do not forget to set an exchange for the message using [ProducibleMessage.setQueue()](api/classes/ProducibleMessage.md#setqueue), [ProducibleMessage.setTopic()](api/classes/ProducibleMessage.md#settopic), or [ProducibleMessage.setFanOut()](api/classes/ProducibleMessage.md#setfanout). Otherwise, an error will be returned.

```javascript
'use strict';
const { ProducibleMessage, Producer } = require('redis-smq');

const producer = new Producer();

// Always run the producer before producing a message
producer.run((err) => {
  if (err) console.error(err);
  else {
    const msg = new ProducibleMessage();
    msg
      .setBody({ hello: 'world' })
      .setTTL(3600000) // message expiration (in millis)
      .setQueue('test_queue'); // setting up a direct exchange
    producer.produce(msg, (err, reply) => {
      if (err) console.error(err);
      else console.log('Successfully produced');
    });
  }
});
```

For more details see:

- [Message Exchanges](message-exchanges.md)
- [Producer Class](api/classes/Producer.md)
