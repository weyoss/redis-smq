# Message Class API

Message properties like `PROPERTY_TTL`, `PROPERTY_RETRY_THRESHOLD`, `PROPERTY_RETRY_DELAY` and 
`PROPERTY_CONSUME_TIMEOUT` can also be defined globally per consumer for all queue messages.

When defined, message instance properties always takes precedence over consumer properties.

## Properties

### Message.PROPERTY_TTL;

Message instance TTL property.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getTTL(); // the same as
message.getProperty(Message.PROPERTY_TTL);
```

### Message.PROPERTY_RETRY_THRESHOLD;

Message instance retry threshold property.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getRetryThreshold(); // the same as
message.getProperty(Message.PROPERTY_RETRY_TRESHOLD);
```

### Message.PROPERTY_RETRY_DELAY;

Message instance retry delay property.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getRetryDelay(); // the same as
message.getProperty(Message.PROPERTY_RETRY_DELAY);
```

### Message.PROPERTY_CONSUME_TIMEOUT;

Message instance consumption timeout property.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getConsumeTimeout(); // the same as
message.getProperty(Message.PROPERTY_CONSUME_TIMEOUT);
```

### Message.PROPERTY_BODY;

Message instance body property.


```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getBody(); // the same as
message.getProperty(Message.PROPERTY_BODY);
```

### Message.PROPERTY_UUID;

Message instance ID property.


```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getId(); // the same as
message.getProperty(Message.PROPERTY_UUID);
```

### Message.PROPERTY_ATTEMPTS;

Message instance attempts property.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getAttempts(); // the same as
message.getProperty(Message.PROPERTY_ATTEMPTS);
```

### Message.PROPERTY_eED_AT;

Message instance creation timestamp property.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getCreatedAt(); // the same as
message.getProperty(Message.PROPERTY_CREATED_AT);
```

### Message.PROPERTY_SCHEDULED_CRON;

Message instance scheduled CRON property.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getMessageScheduledCRON(); // the same as
message.getProperty(Message.PROPERTY_SCHEDULED_CRON);
```

### Message.PROPERTY_SCHEDULED_DELAY;

Message instance scheduled delay property.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getMessageScheduledDelay(); // the same as
message.getProperty(Message.PROPERTY_SCHEDULED_DELAY);
```

### Message.PROPERTY_SCHEDULED_PERIOD;

Message instance scheduled period property.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getMessageScheduledPeriod(); // the same as
message.getProperty(Message.PROPERTY_SCHEDULED_PERIOD);
```

### Message.PROPERTY_SCHEDULED_REPEAT;

Message instance scheduled repeat property.


```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getMessageScheduledRepeat(); // the same as
message.getProperty(Message.PROPERTY_SCHEDULED_REPEAT);
```

### Message.PROPERTY_SCHEDULED_REPEAT_COUNT;

Message instance scheduled repeat count property.


```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getMessageScheduledRepeatCount(); // the same as
message.getProperty(Message.PROPERTY_SCHEDULED_REPEAT_COUNT);
```

### Message.PROPERTY_DELAYED;

Message instance delayed property. `true` when the message has been delayed, otherwise `false`.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.isDelayed(); // the same as
message.getProperty(Message.PROPERTY_DELAYED);
```

## Methods

### Message.prototype.setScheduledPeriod()

Set the time in seconds to wait after the start time to wait before scheduling the message again.

Message scheduled period can be set together with message scheduled repeat.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledRepeat(6); // Schedule the message for delivery 6 times
message.setScheduledPeriod(1); // Wait for one second after each delivery
```

### Message.prototype.setScheduledDelay()

Set the time in seconds that a message will wait before being scheduled for delivery.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledDelay(60); // in seconds
```

### Message.prototype.setScheduledCron()

Set message scheduling using a CRON expression.

CRON scheduling takes priority over delay scheduling.

CRON scheduling can be combined with repeat and period scheduling. For example
if we want a message to be delivered 5 times every hour with a 10 seconds delay between each message we can do:

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledCron('0 0 * * * *');  // Schedule message for delivery every hour
message.setScheduledRepeat(5);
message.setScheduledPeriod(10);
```

### Message.prototype.setScheduledRepeat()

Set the number of times to repeat scheduling a message for delivery.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledRepeat(6); // integer
```

### Message.prototype.setTTL()

Set the amount of time in milliseconds for which the message can live in the message queue.

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

Set the amount of time in seconds to wait for before re-queuing a failed message.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setRetryDelay(60); // 1 minute
```

### Message.prototype.setConsumeTimeout()

Set the amount of time, in milliseconds, for consuming a message.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setConsumeTimeout(30000); // 30 seconds
```

### Message.prototype.setBody()

Set message body property which contains the payload/data associated with the message.

The message body type can be of any supported JavaScript type.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setBody(123);
message.setBody({hello: 'world'});
message.setBody('hello world');
message.setBody('hello world');
```

### Message.prototype.getBody()

Get message body.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setBody(123);
message.getBody(); // 123
````

### Message.prototype.getId()

Get message ID.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getId(); // c53d1766-0e56-4362-8aab-ef70c4eb03ad
````

### Message.prototype.getTTL()

Get message TTL.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getTTL(); // null

message.setTTL(6000);
message.getTTL(); // 6000
````

### Message.prototype.getRetryThreshold()

Get message retry threshold.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getRetryThreshold(); // null

message.setRetryThreshold(10);
message.getRetryThreshold(); // 10
```

### Message.prototype.getRetryDelay()

Get message retry delay.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getRetryDelay(); // null

message.setRetryDelay(60);
message.getRetryDelay(); // 60
```

### Message.prototype.getConsumeTimeout()

Get message consumption timeout.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getConsumeTimeout(); // null

message.setConsumeTimeout(30000);
message.getConsumeTimeout(); // 30000
```


### Message.prototype.getCreatedAt()

Get message creation timestamp.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.getCreatedAt(); // 1530613595087 (in milliseconds)
````

### Message.prototype.getMessageScheduledRepeat()

Get message scheduled repeat.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledRepeat(6); 
message.getMessageScheduledRepeat(); // 6
````

### Message.prototype.getMessageScheduledPeriod()

Get message scheduled period.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledRepeat(6); // Schedule the message for delivery 6 times
message.setScheduledPeriod(1); // Wait for one second after each delivery
message.getMessageScheduledPeriod(); // 1
```

### Message.prototype.getMessageScheduledCRON()

Get message scheduled CRON entry.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledCron('*/10 * * * * *');  // Schedule message for delivery each 10 seconds
message.getMessageScheduledCRON(); // '*/10 * * * * *'
```

### Message.prototype.isDelayed()

Check if the message has been delayed.

A message is delayed when it has been for some time in the scheduler queue and then removed and enqueued for delivery.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.isDelayed(); // false
```

### Message.prototype.getProperty()

Get a message property by specifying its name. This method is an alternative to other existing getters methods 
(like `getTTL()`, `getCreatedAt()`, etc.).

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledCron('*/10 * * * * *');  // Schedule message for delivery each 10 seconds
message.getProperty(Message.PROPERTY_SCHEDULED_CRON); // '*/10 * * * * *'
message.getProperty(Message.PROPERTY_CREATED_AT); // 1530613595087
```

### Message.prototype.toString()

`toString()` method is called when the message object is to be represented as a text value or when the message
is referred to in a manner in which a string is expected.

This method converts convert the message object to a JSON string.

```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledCron('*/10 * * * * *');  // Schedule message for delivery each 10 seconds
message.getProperty(Message.PROPERTY_SCHEDULED_CRON); // '*/10 * * * * *'
message.toString(); // 
```

### Message.createFromMessage()

This method allows to create a new message instance from an existing message.

```text
Message.createFromMessage(message, reset = false) => Message
```

* _message_: required. Can be either a message instance or a string representing the serialized message.

* _reset_: optional. If true, the new message will have all properties from the old one except Message.PROPERTY_UUID, 
Message.PROPERTY_ATTEMPTS, Message.PROPERTY_CREATED_AT.


```javascript
const { Message } = require('redis-smq');

const message = new Message();
message.setScheduledRepeat(6); // Schedule the message for delivery 6 times
message.setScheduledPeriod(1); // Wait for one second after each delivery

const newMessage = Message.createFromMessage(message);

console.log(newMessage.getId() === message.getId()); // true
console.log(newMessage.getMessageScheduledPeriod() === message.getMessageScheduledPeriod()); // true
console.log(newMessage.getMessageScheduledRepeat() === message.getMessageScheduledRepeat()); // true

const anotherMessage = Message.createFromMessage(message, true);
console.log(anotherMessage.getId() === message.getId()); // false
console.log(anotherMessage.getMessageScheduledRepeat() === message.getMessageScheduledRepeat()); // true
console.log(anotherMessage.getMessageScheduledRepeat() === message.getMessageScheduledRepeat()); // true
```