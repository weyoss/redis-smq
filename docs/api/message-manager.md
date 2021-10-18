# Message Manager API

```javascript
const { MessageManager } = require('redis-smq');
const config = require('./config');

MessageManager.getSingletonInstance(config, (err, messageManager) => {
  if (err) console.log(err);
  else {
    // ...
  }
})
```

## Public properties

No public property exists.

## Public methods

### MessageManager.prototype.getAcknowledgedMessages()
### MessageManager.prototype.getDeadLetterMessages()
### MessageManager.prototype.getPendingMessages()
### MessageManager.prototype.getPendingMessagesWithPriority()
### MessageManager.prototype.getScheduledMessages()

```javascript
messageManager.getScheduledMessages(queueName, skip, take, cb);
```

**Parameters**

- `queueName` *(string): Required.* Queue name.
- `skip` *(number): Required.* Offset from where messages should be taken. Starts from 0.
- `take` *(number): Required.* Max number of messages that should be taken. Starts from 1.
- `cb(err, result)` *(Function): Required.* A callback function.
    - `err` *(Error | null | undefined).*
    - `result.total` *(number).* Total messages that has been scheduled so far.
    - `result.items` *(Message[]).* An array of scheduled messages.


```javascript
messageManager.getScheduledMessages(0, 25, (err, result) => {
   if (err) console.log(err);
   else {
       console.log('Total scheduled items: ', result.total);
       console.log('Items: ', result.items);
   }
});
```

### MessageManager.prototype.getMessageMetadata()

### MessageManager.prototype.deleteScheduledMessage()

```javascript
messageManager.deleteScheduledMessage(queueName, messageId, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `messageId` *(string): Required.* A Message ID which was previously scheduled.
- `cb(err, result)` * (Function): Required. A callback function.
    - `err` *(Error | null | undefined).*
    - `result` *(boolean | undefined).* Indicates whether the message has been deleted.

```javascript
messageManager.deleteScheduledMessage(queueName, messageId, (err, result) => {
   if (err) console.log(err);
   else if (result === true) console.log('Message has been successfully deleted');
   else console.log('Message has not been deleted');
});
```

### MessageManager.prototype.quit()

## Public static methods

### MessageManager.getSingletonInstance()