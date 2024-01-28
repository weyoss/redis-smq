[RedisSMQ](../README.md) / [Docs](README.md) / Scheduling Messages

# Scheduling Messages

Starting with version 1.0.19, RedisSMQ enables you to schedule a one-time or repeating messages in your MQ server.

To set up scheduling parameters for a given message, the [ProducibleMessage Class](api/classes/ProducibleMessage.md) provides:

* [ProducibleMessage.prototype.setScheduledCRON()](api/classes/ProducibleMessage.md#setscheduledcron)
* [ProducibleMessage.prototype.setScheduledDelay()](api/classes/ProducibleMessage.md#setscheduleddelay)
* [ProducibleMessage.prototype.setScheduledRepeat()](api/classes/ProducibleMessage.md#setscheduledrepeat)
* [ProducibleMessage.prototype.setScheduledRepeatPeriod()](api/classes/ProducibleMessage.md#setscheduledrepeatperiod)

To schedule your message, you can publish it, as any other message, from your [Producer Class](api/classes/Producer.md) 
using the [produce()](api/classes/Producer.md#produce) method.

```javascript
'use strict';
const { ProducibleMessage } = require('redis-smq');

const msg = new ProducibleMessage();
msg
  .setBody({ hello: 'world' })
  .setScheduledCRON(`0 0 * * * *`)
  .setQueue('test_queue');

producer.produce(msg, (err) => {
  if (err) console.error(err);
  else console.log('Message has been successfully scheduled');
})
```

For managing scheduled messages see [QueueScheduledMessages Class](api/classes/QueueScheduledMessages.md).

To delete a scheduled message see [Message.deleteMessageById()](api/classes/Message.md#deletemessagebyid).

Scheduled messages can be also managed using the [HTTP API Interface](https://github.com/weyoss/redis-smq-monitor) or from your browser with the help of the [Web UI](https://github.com/weyoss/redis-smq-monitor-client).