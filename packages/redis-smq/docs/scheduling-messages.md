[RedisSMQ](../README.md) / [Docs](README.md) / Scheduling Messages

# Scheduling Messages

Starting with version 1.0.19, RedisSMQ introduces the ability to schedule one-time or recurring messages within your
message queue (MQ) server.

## Configuring Scheduling Parameters

To set up scheduling parameters for a specific message, you can utilize the following methods available in the [ProducibleMessage Class](api/classes/ProducibleMessage.md):

- **[setScheduledCRON()](api/classes/ProducibleMessage.md#setscheduledcron)**: Allows you to specify a CRON expression for scheduling.
- **[setScheduledDelay()](api/classes/ProducibleMessage.md#setscheduleddelay)**: Enables you to define a delay before the message is published.
- **[setScheduledRepeat()](api/classes/ProducibleMessage.md#setscheduledrepeat)**: Used for setting up the message to repeat after a specified interval.
- **[setScheduledRepeatPeriod()](api/classes/ProducibleMessage.md#setscheduledrepeatperiod)**: Sets the duration between each repeat occurrence.

You can publish scheduled messages just like any other message using the [Producer.produce()](api/classes/Producer.md#produce) method.

## Example

Here’s a sample code snippet to demonstrate how to schedule a message:

```javascript
'use strict';
const { ProducibleMessage } = require('redis-smq');

const msg = new ProducibleMessage()
  .setBody({ hello: 'world' }) // Set the message body
  .setScheduledCRON(`0 0 * * * *`) // Schedule the message with a CRON expression
  .setQueue('test_queue'); // Specify the target queue

producer.produce(msg, (err, messageIds) => {
  if (err) {
    console.error(err); // Log error if message scheduling fails
  } else {
    console.log(
      'Message has been successfully scheduled. Message IDs are: ',
      messageIds.join(','),
    );
  }
});
```

## Managing Scheduled Messages

For effective management of scheduled messages, refer to the following classes:

- **[QueueScheduledMessages Class](api/classes/QueueScheduledMessages.md)**: Provides methods for handling scheduled messages in the queue.
- **[Message Class](api/classes/Message.md)**: Offers additional functionalities for manipulating individual messages.

