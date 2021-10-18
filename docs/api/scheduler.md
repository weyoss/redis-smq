# Message Scheduler

Starting with version 1.0.19, `Message Scheduler` enables you to schedule a one-time or repeating messages in your MQ server.

To set up scheduling parameters for a specific message, the [Message API](docs/api/message.md) provides:

- [setScheduledPeriod()](docs/api/message.md#messageprototypesetscheduledperiod)
- [setScheduledDelay()](docs/api/message.md#messageprototypesetscheduleddelay)
- [setScheduledCron()](docs/api/message.md#messageprototypesetscheduledcron)
- [setScheduledRepeat()](docs/api/message.md#messageprototypesetscheduledrepeat)

Once ready, to schedule your message you can use, as usually you do for publishing any message, 
[producer.produceMessage()](docs/api/producer.md#producerprototypeproducemessage): 

```javascript
'use strict';
const { Message, Producer } = require('redis-smq');

const producer = new Producer('test_queue');

const message = new Message();
message
    .setBody({hello: 'world'})
    .setScheduledCron(`0 0 * * * *`);

producer.produceMessage(message, (err) => {
    if (err) console.log(err);
    else if (rely) console.log('Message has been successfully scheduled');
    else console.log('Message has not been scheduled');
})
```

For managing scheduled messages, the [Message Manager](message-manager.md) provides:

- [getScheduledMessages()](message-manager.md#messagemanagerprototypegetscheduledmessages)
- [deleteScheduledMessage()](message-manager.md#messagemanagerprototypedeletescheduledmessage)

To purge clear all scheduled messages of a given queue, the [Queue Manager](queue-manager.md) provides:

- [purgeScheduledMessagesQueue]()