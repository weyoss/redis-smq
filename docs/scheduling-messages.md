[RedisSMQ](../README.md) / [Docs](README.md) / Scheduling Messages

# Scheduling Messages

Starting with version 1.0.19, RedisSMQ enables you to schedule a one-time or repeating messages in your MQ server.

To set up scheduling parameters for a given message, the [MessageEnvelope Class](api/classes/MessageEnvelope.md) provides:

* [MessageEnvelope.prototype.setScheduledCRON()](api/classes/MessageEnvelope.md#setscheduledcron)
* [MessageEnvelope.prototype.setScheduledDelay()](api/classes/MessageEnvelope.md#setscheduleddelay)
* [MessageEnvelope.prototype.setScheduledRepeat()](api/classes/MessageEnvelope.md#setscheduledrepeat)
* [MessageEnvelope.prototype.setScheduledRepeatPeriod()](api/classes/MessageEnvelope.md#setscheduledrepeatperiod)

To schedule your message, you can publish it, as any other message, from your [Producer Class](api/classes/Producer.md) 
using the [produce()](api/classes/Producer.md#produce) method.

```javascript
'use strict';
const { MessageEnvelope } = require('redis-smq');

const msg = new MessageEnvelope();
msg
  .setBody({ hello: 'world' })
  .setScheduledCRON(`0 0 * * * *`)
  .setQueue('test_queue');

producer.produce(msg, (err) => {
  if (err) console.log(err);
  else console.log('Message has been successfully scheduled');
})
```

For managing scheduled messages see [QueueScheduledMessages Class](api/classes/QueueScheduledMessages.md).

To delete a scheduled message see [QueueMessages.deleteMessageById()](api/classes/QueueMessages.md#deletemessagebyid).

Scheduled messages can be also managed using the [HTTP API Interface](https://github.com/weyoss/redis-smq-monitor) or from your browser with the help of the [Web UI](https://github.com/weyoss/redis-smq-monitor-client).