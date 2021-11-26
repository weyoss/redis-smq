# Message Class API

For a given `Message` instance, properties like `ttl`, `retryThreshold`, `retryDelay`, `consumeTimeout` are configured using:

- [setTTL()](#messageprototypesetttl)
- [setRetryThreshold()](#messageprototypesetretrythreshold)
- [setRetryDelay()](#messageprototypesetretrydelay)
- [setConsumeTimeout()](#messageprototypesetconsumetimeout)

Optionally, the default values for these properties, can be set using the MQ configuration. See [Configuration](/docs/configuration.md) 
for more details. 

## Public Static Properties

### Message.MessagePriority

Message priority values that you can apply to a given message. Valid message priorities are:

- `Message.MessagePriority.LOWEST`
- `Message.MessagePriority.VERY_LOW`
- `Message.MessagePriority.LOW`
- `Message.MessagePriority.NORMAL`
- `Message.MessagePriority.ABOVE_NORMAL`
- `Message.MessagePriority.HIGH`
- `Message.MessagePriority.VERY_HIGH`
- `Message.MessagePriority.HIGHEST`

You can set a priority for a given message using [setPriority()](#messageprototypesetpriority). Do not forget to 
configure your producers and consumers to use [Priority queues](/docs/priority-queues.md).

## Public Methods

### Message.prototype.setScheduledPeriod()

Set the time in seconds to wait after the start time to wait before scheduling the message again.

Message scheduled period can be configured together with [message scheduled repeat](#messageprototypesetscheduledrepeat).

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledRepeat(6); // Schedule the message for delivery 6 times
message.setScheduledPeriod(1000); // Wait for one second after each delivery
```

### Message.prototype.setScheduledDelay()

Set the time, in milliseconds, that a message will wait before being scheduled for delivery.

`Delay scheduling`, when set, always takes priority over `CRON scheduling` or `repeat scheduling`.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledDelay(60000); // in millis
```

### Message.prototype.setScheduledCron()

Schedule a message using a CRON expression.

`CRON scheduling` can be combined with `repeat and period scheduling`. For example if we want a message to be delivered 
5 times every hour with a 10 seconds delay between each message delivery, we can do:

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledCron('0 0 * * * *');  // Schedule message for delivery every hour
message.setScheduledRepeat(5);
message.setScheduledPeriod(10000); // in millis
```

### Message.prototype.setScheduledRepeat()

Schedule a message to be delivered N times.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledRepeat(6); // integer
```

### Message.prototype.setTTL()

Set the amount of time, in milliseconds, for which the message can live in the message queue.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setTTL(3600000); // in milliseconds
```

### Message.prototype.setRetryThreshold()

Set the number of times the message can be re-queued after failure.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setRetryThreshold(10);
```

### Message.prototype.setRetryDelay()

Set the amount of time, in milliseconds, to wait for before re-queuing a failed message.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setRetryDelay(60000); // 1 minute
```

### Message.prototype.setConsumeTimeout()

Set the amount of time, in milliseconds, for consuming a message.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setConsumeTimeout(30000); // 30 seconds
```

### Message.prototype.setBody()

Set the message payload. Message body type can be any valid JSON data type.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setBody(123);
message.setBody({hello: 'world'});
message.setBody('hello world');
```

### Message.prototype.setPriority()

Set message priority.

```javascript
const { Message } = require('redis-smq');

const msg = new Message();
msg.setPriority(Message.MessagePriority.ABOVE_NORMAL);
```

See:
- [Message Priority](#messagemessagepriority) for valid message priorities.
- [Priority queues](/docs/priority-queues.md) for more details about priority messaging.

### Message.prototype.getBody()

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setBody(123);
message.getBody(); // 123
````

### Message.prototype.getId()

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getId(); // c53d1766-0e56-4362-8aab-ef70c4eb03ad
````

### Message.prototype.getTTL()

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getTTL(); // null

message.setTTL(6000);
message.getTTL(); // 6000, in millis
````

### Message.prototype.getRetryThreshold()

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getRetryThreshold(); // null

message.setRetryThreshold(10);
message.getRetryThreshold(); // 10
```

### Message.prototype.getRetryDelay()

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getRetryDelay(); // null

message.setRetryDelay(60000);
message.getRetryDelay(); // 60000, in millis
```

### Message.prototype.getConsumeTimeout()

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getConsumeTimeout(); // null

message.setConsumeTimeout(30000);
message.getConsumeTimeout(); // 30000, in millis
```

### Message.prototype.getCreatedAt()

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getCreatedAt(); // 1530613595087, in millis
````

### Message.prototype.getPublishedAt()

```javascript
const { Message, Producer } = require('redis-smq');

const message = new Message();
message.getPublishedAt(); // null

const producer = new Producer('test_queue');
producer.produceMessage(message, (err) => {
    if (err) console.log(err);
    else {
        message.getPublishedAt(); // 1530613595087, in millis
    }
});
````

### Message.prototype.getScheduledAt()

```javascript
const { Message, Producer } = require('redis-smq');

const message = new Message();
message.setScheduledRepeat(6);
message.getScheduledAt(); // null

const producer = new Producer('test_queue');
producer.produceMessage(message, (err) => {
    if (err) console.log(err);
    else {
        message.getPublishedAt(); // null
        message.getScheduledAt(); // 1530613595087, in millis
    }
});
````

### Message.prototype.getMessageScheduledRepeat()

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledRepeat(6); 
message.getMessageScheduledRepeat(); // 6
````

### Message.prototype.getMessageScheduledPeriod()

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledRepeat(6); // Schedule the message for delivery 6 times
message.setScheduledPeriod(1000); // Wait for one second after each delivery
message.getMessageScheduledPeriod(); // 1000, in millis
```

### Message.prototype.getMessageScheduledCRON()

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledCron('*/10 * * * * *');  // Schedule message for delivery each 10 seconds
message.getMessageScheduledCRON(); // '*/10 * * * * *'
```

### Message.prototype.getPriority()

```javascript
const { Message } = require('redis-smq');

const msg = new Message();
msg.setPriority(Message.MessagePriority.ABOVE_NORMAL);

msg.getPriority() // Message.MessagePriority.ABOVE_NORMAL
```

### Other Methods

These methods are used internally and should not be used in your application:

- Message.prototype.getMessageScheduledDelay()
- Message.prototype.getMessageScheduledRepeatCount()
- Message.prototype.getAttempts()
- Message.prototype.incrAttempts()
- Message.prototype.resetMessageScheduledRepeatCount()
- Message.prototype.setMessageScheduledRepeatCount()
- Message.prototype.setMessageScheduledCronFired()
- Message.prototype.incrMessageScheduledRepeatCount()
- Message.prototype.setAttempts()
- Message.prototype.setMessageDelayed()
- Message.prototype.setPublishedAt()
- Message.prototype.setScheduledAt()
- Message.prototype.reset()
- Message.prototype.isDelayed()
- Message.createFromMessage()
- Message.prototype.toString()