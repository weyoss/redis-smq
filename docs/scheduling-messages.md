# Scheduling Messages

Starting with version 1.0.19, RedisSMQ enables you to schedule a one-time or repeating messages in your MQ server.

To set up scheduling parameters for a given message, the [Message API](api/message.md) provides:

- [setScheduledDelay()](api/message.md#messageprototypesetscheduleddelay)
- [setScheduledCRON()](api/message.md#messageprototypesetscheduledcron)
- [setScheduledRepeat()](api/message.md#messageprototypesetscheduledrepeat)
- [setScheduledRepeatPeriod()](api/message.md#messageprototypesetscheduledrepeatperiod)

To schedule your message, you can publish it, as any other message, from your [Producer](api/producer.md#producerprototypeproduce) 
using the `produce()` method.

```javascript
'use strict';
const { Message, Producer } = require('redis-smq');

const producer = new Producer();

const message = new Message();
message
  .setBody({ hello: 'world' })
  .setScheduledCRON(`0 0 * * * *`)
  .setQueue('test_queue');

producer.produce(message, (err, reply) => {
  if (err) console.log(err);
  else if (rely) console.log('Message has been successfully scheduled');
  else console.log('Message has not been scheduled');
})
```

For managing scheduled messages, the [Message Manager](api/message-manager.md) provides:

- [getScheduledMessages()](api/message-manager.md#messagemanagerprototypegetscheduledmessages)
- [deleteScheduledMessage()](api/message-manager.md#messagemanagerprototypedeletescheduledmessage)
- [purgeScheduledMessages()](api/message-manager.md#messagemanagerprototypepurgescheduledmessages)

Scheduled messages can be also managed using the [HTTP API Interface](/docs/http-api.md) or from your browser with the help of the [Web UI](/docs/web-ui.md).