>[RedisSMQ](../README.md) / [Docs](README.md) / Scheduling Messages

# Scheduling Messages

Starting with version 1.0.19, RedisSMQ enables you to schedule a one-time or repeating messages in your MQ server.

To set up scheduling parameters for a given message, the [Message Class](api/classes/Message.md) provides:

* [Message.prototype.setScheduledCRON()](api/classes/Message.md#setscheduledcron)
* [Message.prototype.setScheduledDelay()](api/classes/Message.md#setscheduleddelay)
* [Message.prototype.setScheduledRepeat()](api/classes/Message.md#setscheduledrepeat)
* [Message.prototype.setScheduledRepeatPeriod()](api/classes/Message.md#setscheduledrepeatperiod)

To schedule your message, you can publish it, as any other message, from your [Producer Class](api/classes/Producer.md) 
using the [produce()](api/classes/Producer.md#produce) method.

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

For managing scheduled messages see [QueueScheduledMessages Class](api/classes/QueueScheduledMessages.md).

To delete a scheduled message see [QueueMessages.deleteMessageById()](api/classes/QueueMessages.md#deletemessagebyid).

Scheduled messages can be also managed using the [HTTP API Interface](https://github.com/weyoss/redis-smq-monitor) or from your browser with the help of the [Web UI](https://github.com/weyoss/redis-smq-monitor-client).