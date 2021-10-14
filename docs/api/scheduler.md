# Scheduler Class API

Starting with version 1.0.19, `Message Scheduler` enables you to schedule a one-time or repeating messages in your MQ server.

The [Message API](docs/api/message.md) provides many methods:

- [setScheduledPeriod()](docs/api/message.md#messageprototypesetscheduledperiod)
- [setScheduledDelay()](docs/api/message.md#messageprototypesetscheduleddelay)
- [setScheduledCron()](docs/api/message.md#messageprototypesetscheduledcron)
- [setScheduledRepeat()](docs/api/message.md#messageprototypesetscheduledrepeat)

in order to set up scheduling parameters for a specific message. Once your message is ready, you can use
[producer.produceMessage()](docs/api/producer.md#producerprototypeproducemessage) to publish it.

Under the hood, the `producer` invokes `isSchedulable()` and `schedule()`  of the [Scheduler class](docs/api/scheduler.md)
to place your message in the delay queue.

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
    else console.log('Message has been succefully produced');
})
```

Alternatively, you can also manually get the `Scheduler` from MQ and use it like shown in the example bellow: 

```javascript
const { Scheduler } = require('redis-smq');
const config = require('./config');

Scheduler.getSingletonInstance('test_queue', config, (err, scheduler) => {
  if (err) console.log(err);
  else {
    const message = new Message();
    message.setBody({hello: 'world'}).setScheduledCron(`0 0 * * * *`);
    scheduler.schedule(message, (err, reply) => {
      if (err) console.log(err);
      else if (rely) console.log('Message has been successfully scheduled');
      else console.log('Message has not been scheduled');
    });
  }
})

```

## Public properties

No public property exists.

## Public methods

### Scheduler.prototype.schedule()

```javascript
scheduler.schedule(message, mixed);
```

**Parameters**

- `message` *(Message): Required.* A Message instance.
- `mixed` *(Function | Redis.Multi | IORedis.Pipeline): Required.* When `mixed` is a callback function, its 
   signature is `cb(err, result)` where:
    - `err` *(Error | null | undefined).*
    - `result` *(boolean | undefined).* Indicates whether the message has been scheduled.
  
```javascript
const message = new Message();
message.setBody({hello: 'world'}).setScheduledCron(`0 0 * * * *`);
scheduler.schedule(message, (err, rely) => {
  if (err) console.log(err);
  else if (rely) console.log('Message has been succefully scheduled');
  else console.log('Message has not been scheduled');
});
```

### Scheduler.prototype.deleteScheduledMessage()

```javascript
scheduler.deleteScheduledMessage(messageId, cb);
```

**Parameters**

- `message` *(string): Required.* A Message ID which was previously scheduled.
- `cb(err, result)` * (Function): Required. A callback function. 
    - `err` *(Error | null | undefined).*
    - `result` *(boolean | undefined).* Indicates whether the message has been deleted.

```javascript
scheduler.deleteScheduledMessage(message_id, (err, result) => {
   if (err) console.log(err);
   else if (result === true) console.log('Message has been succefully deleted');
   else console.log('Message has not been deleted');
});
```

### Scheduler.prototype.getScheduledMessages()

```javascript
scheduler.getScheduledMessages(skip, take, cb);
```

**Parameters**

- `skip` *(number): Required.* Offset from where messages should be taken. Starts from 0.
- `take` *(number): Required.* Max number of messages that should be taken. Starts from 1.
- `cb(err, result)` *(Function): Required.* A callback function. 
  - `err` *(Error | null | undefined).*
  - `result.total` *(number).* Total messages that has been scheduled so far.
  - `result.items` *(Message[]).* An array of scheduled messages.


```javascript
scheduler.getScheduledMessages(0, 25, (err, result) => {
   if (err) console.log(err);
   else {
       console.log('Total scheduled items: ', result.total);
       console.log('Items: ', result.items);
   }
});
```
### Scheduler.prototype.isSchedulable()

**Syntax**

```javascript
scheduler.isSchedulable(message);
```

**Parameters**

- `message` *(Message): Required.* A Message instance.

**Return type**

Boolean. True if one of message scheduling parameters has been set.

### Scheduler.prototype.isPeriodic()

```javascript
scheduler.isPeriodic(message);
```

**Parameters**

- `message` *(Message): Required.* A Message instance.

**Return type**

Boolean. True when either message `scheduling repeat` or `scheduling CRON` has been set.

## Other public methods

These methods are used internally and should not be used in your application:

- Scheduler.prototype.scheduleAtNextTimestamp()
- Scheduler.prototype.enqueueScheduledMessage()
- Scheduler.prototype.enqueueScheduledMessages()
- Scheduler.prototype.quit()
