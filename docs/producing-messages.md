[RedisSMQ](../README.md) / [Docs](README.md) / Producing Messages

# Producing Messages

A `Producer` instance allows to publish a message to a queue.

You can use a single `Producer` instance to produce messages, including messages with priority, to one or multiple queues.

Before publishing a message do not forget to set an exchange for the message using [setQueue()](api/classes/MessageEnvelope.md#setqueue), 
[setTopic()](api/classes/MessageEnvelope.md#settopic), or [setFanOut()](api/classes/MessageEnvelope.md#setfanout). 
Otherwise, an error will be returned.

See [Message Exchanges](message-exchanges.md) for more details.

```javascript
'use strict';
const {MessageEnvelope, Producer} = require('redis-smq');

const producer = new Producer();
producer.run((err) => {
   if (err) throw err;
   const msg = new MessageEnvelope();
   msg.setBody({hello: 'world'})
      .setTTL(3600000) // message expiration (in millis)
      .setQueue('test_queue'); // setting up a direct exchange 
   producer.produce(msg, (err, reply) => {
      if (err) console.log(err);
      else console.log('Successfully produced');
   });
})
```

See [Producer Class](api/classes/Producer.md) for more details.
