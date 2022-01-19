# Scheduling Messages

Starting with version 1.0.19, RedisSMQ enables you to schedule a one-time or repeating messages in your MQ server.

To set up scheduling parameters for a given message, the [Message API](api/message.md) provides:

- [setScheduledPeriod()](api/message.md#messageprototypesetscheduledperiod)
- [setScheduledDelay()](api/message.md#messageprototypesetscheduleddelay)
- [setScheduledCron()](api/message.md#messageprototypesetscheduledcron)
- [setScheduledRepeat()](api/message.md#messageprototypesetscheduledrepeat)

To schedule your message, you can publish it, as any other message, from your [Producer](api/producer.md#producerprototypeproduce) 
using the `produce()` method.

```javascript
'use strict';
const {Message, Producer} = require('redis-smq');

const producer = new Producer();

const message = new Message();
message
    .setBody({hello: 'world'})
    .setScheduledCron(`0 0 * * * *`)
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

To purge clear all scheduled messages of a given queue, the [Queue Manager](api/queue-manager.md) provides:

- [purgeScheduledQueue](api/queue-manager.md#queuemanagerprototypepurgescheduledqueue)

Scheduled messages can be also managed using the [Web UI](/docs/web-ui.md).