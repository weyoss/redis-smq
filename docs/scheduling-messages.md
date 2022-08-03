# Scheduling Messages

Starting with version 1.0.19, RedisSMQ enables you to schedule a one-time or repeating messages in your MQ server.

To set up scheduling parameters for a given message, the [Message API](/docs/api/message.md) provides:

* [Message.prototype.setScheduledCRON()](/docs/api/message.md#messageprototypesetscheduledcron)
* [Message.prototype.setScheduledDelay()](/docs/api/message.md#messageprototypesetscheduleddelay)
* [Message.prototype.setScheduledRepeat()](/docs/api/message.md#messageprototypesetscheduledrepeat)
* [Message.prototype.setScheduledRepeatPeriod()](/docs/api/message.md#messageprototypesetscheduledrepeatperiod)

To schedule your message, you can publish it, as any other message, from your [Producer](/docs/api/producer.md#producerprototypeproduce) 
using the `produce()` method.

```javascript
'use strict';
const { Message } = require('redis-smq');

const message = new Message();
message
  .setBody({ hello: 'world' })
  .setScheduledCRON(`0 0 * * * *`)
  .setQueue('test_queue');

producer.produce(message, (err) => {
  if (err) console.log(err);
  else console.log('Message has been successfully scheduled');
})
```

For managing scheduled messages, the [Message Manager](/docs/api/message-manager.md) provides:

* [MessageManager.prototype.scheduledMessages.list()](/docs/api/message-manager.md#list)
* [MessageManager.prototype.scheduledMessages.delete()](/docs/api/message-manager.md#delete)
* [MessageManager.prototype.scheduledMessages.purge()](/docs/api/message-manager.md#purge)

Scheduled messages can be also managed using the [HTTP API Interface](https://github.com/weyoss/redis-smq-monitor) or from your browser with the help of the [Web UI](https://github.com/weyoss/redis-smq-monitor-client).