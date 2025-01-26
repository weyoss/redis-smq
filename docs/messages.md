[RedisSMQ](../README.md) / [Docs](README.md) / Messages

# Messages

The [`ProducibleMessage Class`](api/classes/ProducibleMessage.md) handles application data, commonly known as the message payload, that can be 
delivered to a consumer for asynchronous processing.

The message payload can consist of any valid JSON data type. It may be as simple as a text message like `Hello world` or 
as complex as an object like `{ hello: 'world' }`.

```javascript
const { ProducibleMessage } = require('redis-smq');

const msg = new ProducibleMessage();
msg.setBody({ hello: 'world' })
  .setTTL(3600000) // Sets Time-To-Live to 1 hour
  .setRetryThreshold(5); // Sets maximum retries to 5
```

The [`ProducibleMessage Class`](api/classes/ProducibleMessage.md) offers a variety of methods to configure different delivery and consumption 
parameters, including `message priority`, `time-to-live (TTL)`, and `retry threshold`.

For more details, refer to the following resources:

- [ProducibleMessage Class](api/classes/ProducibleMessage.md): Configure various message parameters before publishing.
- [Message Class](api/classes/Message.md): Fetch or delete individual messages or a list of messages from a queue.
- [QueueMessages Class](api/classes/QueueMessages.md): Manage messages within the queue.
- [QueuePendingMessages Class](api/classes/QueuePendingMessages.md): Manage messages that are pending processing.
- [QueueAcknowledgedMessages Class](api/classes/QueueAcknowledgedMessages.md): Handle messages that have been acknowledged.
- [QueueDeadLetteredMessages Class](api/classes/QueueDeadLetteredMessages.md): Manage messages that have been sent to a dead-letter queue.
- [QueueScheduledMessages Class](api/classes/QueueScheduledMessages.md): Manage messages that are scheduled for future delivery.

By utilizing these classes effectively, you can optimize message handling and improve the efficiency of your 
application's asynchronous processing.
