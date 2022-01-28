# Message Class API

## Configuration

For each new Message instance, the default values for the following properties are:

- `Message TTL` - 0 (has no effect)
- `Message retry threshold` - 3
- `Message retry delay` - 60000
- `Message consume timeout` - 0 (has no effect)

You can overwrite these default values using the [configuration object](/docs/configuration.md).

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

Message priority can be set using [setPriority()](#messageprototypesetpriority). Do not forget to 
configure your producers and consumers to use [Priority queues](/docs/priority-queues.md).

## Public Methods

### Message.prototype.setQueue()

```javascript
setQueue(queue);
```

**Parameters**

- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used.
  Otherwise, you can explicity provide an object which has the following signature:
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.

The queue name can be composed only of letters (a-z), numbers (0-9) and (-_) characters.

### Message.prototype.setBody()

Set the message payload. The message body type can be any valid JSON data type.

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

### Message.prototype.setTTL()

Set the amount of time, called TTL (time-to-live), in milliseconds, for which the message can live in the message
queue. A message is guaranteed to not be delivered if it has been in the queue for longer than TTL. By
default, message TTL is not set.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setTTL(3600000); // in milliseconds
```

### Message.prototype.setConsumeTimeout()

Set the amount of time, also called job timeout, in milliseconds before a consumer consuming a message times out. If the
consumer does not consume the message within the set time limit, the message consumption is automatically canceled.
By default, message consumption timeout is not set.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setConsumeTimeout(30000); // 30 seconds
```

### Message.prototype.setRetryThreshold()

Set the number of times the message can be re-queued and delivered again after a failure. By default, message retry
threshold is 3.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setRetryThreshold(10);
```

### Message.prototype.setRetryDelay()

Set the amount of time, in milliseconds, to wait for before re-queuing a message after a failure. By default, message
retry delay is 60000 ms (1 minute).

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setRetryDelay(120000); // in millis
```

### Message.prototype.setScheduledDelay()

Set the amount of time, in milliseconds, to wait for before enqueuing a given message.

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

Schedule a message to be enqueued N times.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledRepeat(6); // integer
```

### Message.prototype.setScheduledPeriod()

Set the amount of time, in milliseconds, to wait for before enqueuing a given message.

`Message scheduled period` only takes effect when combined with [message scheduled repeat](#messageprototypesetscheduledrepeat).

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledRepeat(6); // Schedule the message for delivery 6 times
message.setScheduledPeriod(1000); // Wait for one second after each delivery
```

### Message.prototype.getBody()

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setBody(123);
message.getBody(); // 123
````

### Message.prototype.getId()

```javascript
const { Message, Producer } = require('redis-smq');

const message = new Message();
message.setQueue('test_queue').setBody('some data');
message.getId(); // null


new Producer().produce(message, (err) => {
  if (err) console.log(err);
  else {
    const messageId = message.getId(); // c53d1766-0e56-4362-8aab-ef70c4eb03ad
    console.log('Message ID is ', messageId);
  }
})

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
const {Message, Producer} = require('redis-smq');

const message = new Message();
message.setQueue('test_queue').setBody('Test message');
message.getPublishedAt(); // null

const producer = new Producer();
producer.produce(message, (err) => {
    if (err) console.log(err);
    else {
        message.getPublishedAt(); // 1530613595087, in millis
    }
});
````

### Message.prototype.getScheduledAt()

```javascript
const {Message, Producer} = require('redis-smq');

const message = new Message();
message.setScheduledRepeat(6);
message.getScheduledAt(); // null
message.setQueue('test_queue');
message.setBody('Test message');

const producer = new Producer();
producer.produce(message, (err) => {
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