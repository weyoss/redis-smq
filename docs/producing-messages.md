>[RedisSMQ](../README.md) / [Docs](README.md) / Producing Messages

# Producing Messages

A `Producer` instance allows to publish a message to a queue.

You can use a single `Producer` instance to produce messages, including messages with priority, to one or multiple queues.

Before publishing a message do not forget to set an exchange for the message using [setQueue()](api/classes/Message.md#setqueue), 
[setTopic()](api/classes/Message.md#settopic), or [setFanOut()](api/classes/Message.md#setfanout). 
Otherwise, an error will be returned.

See [Message Exchanges](message-exchanges.md) for more details.

```javascript
'use strict';
const {Message, Producer} = require('redis-smq');

const producer = new Producer();
producer.run((err) => {
   if (err) throw err;
   const message = new Message();
   message
           .setBody({hello: 'world'})
           .setTTL(3600000) // message expiration (in millis)
           .setQueue('test_queue'); // setting up a direct exchange 
   message.getId() // null
   producer.produce(message, (err) => {
      if (err) console.log(err);
      else {
         const msgId = message.getId(); // string
         console.log('Successfully produced. Message ID is ', msgId);
      }
   });
})
```

See [Producer Class](api/classes/Producer.md) for more details.
