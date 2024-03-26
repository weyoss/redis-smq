[RedisSMQ](../README.md) / [Docs](README.md) / Scheduling Messages

# Scheduling Messages

Starting with version 1.0.19, RedisSMQ enables you to schedule a one-time or repeating messages in your MQ server.

To set up scheduling parameters for a given message, the [ProducibleMessage Class](api/classes/ProducibleMessage.md) provides:

- [ProducibleMessage.setScheduledCRON()](api/classes/ProducibleMessage.md#setscheduledcron)
- [ProducibleMessage.setScheduledDelay()](api/classes/ProducibleMessage.md#setscheduleddelay)
- [ProducibleMessage.setScheduledRepeat()](api/classes/ProducibleMessage.md#setscheduledrepeat)
- [ProducibleMessage.setScheduledRepeatPeriod()](api/classes/ProducibleMessage.md#setscheduledrepeatperiod)

You can publish scheduled messages, as any other message, using the [Producer.produce()](api/classes/Producer.md#produce) method.

```javascript
'use strict';
const { ProducibleMessage } = require('redis-smq');

const msg = new ProducibleMessage();
msg
  .setBody({ hello: 'world' })
  .setScheduledCRON(`0 0 * * * *`)
  .setQueue('test_queue');

producer.produce(msg, (err, messageIds) => {
  if (err) console.error(err);
  else console.log('Message has been successfully scheduled. Message IDs are: ', messageIds.join(','));
});
```

For managing scheduled messages see:

- [QueueScheduledMessages Class](api/classes/QueueScheduledMessages.md)
- [Message Class](api/classes/Message.md)

Scheduled messages may be also managed using the [HTTP API Interface](https://github.com/weyoss/redis-smq-monitor) or from your browser with the help of the [Web UI](https://github.com/weyoss/redis-smq-monitor-client).
