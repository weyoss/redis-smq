# Scheduler Class API

Scheduler Class can not be directly instantiated but instead its instance can be obtained from the producer 
or the consumer using `getScheduler()`.

```javascript
'use strict';
const { Consumer, Producer } = require('redis-smq');

const producer = new Producer('test_queue');
producer.getScheduler((err, scheduler) => {
    // ...   
});

// Or
const consumer = new Consumer('test_queue');
consumer.getScheduler((err, scheduler) => {
    // ...
});
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
