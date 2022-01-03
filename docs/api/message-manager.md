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

## Public Static Methods

### MessageManager.getSingletonInstance()

```javascript
getSingletonInstance(config, cb)
```

**Parameters**
- `config` *(number): Required.* configuration object.
- `cb(err, messageManager)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `messageManager` *(MessageManager).* MessageManager instance.

## Public Methods

### MessageManager.prototype.getScheduledMessages()

```javascript
getScheduledMessages(skip, take, cb);
```

**Parameters**

- `skip` *(number): Required.* Offset from where messages should be taken. Starts from 0.
- `take` *(number): Required.* Max number of messages that should be taken. Starts from 1.
- `cb(err, result)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).*
  - `result.total` *(number).* Total messages that has been scheduled so far.
  - `result.items` *(Array).* An array of scheduled messages.

### MessageManager.prototype.getPendingMessagesWithPriority()

```javascript
getPendingMessagesWithPriority(queue, skip, take, cb);
```

**Parameters**

- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used. 
Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `skip` *(number): Required.* Offset from where messages should be taken. Starts from 0.
- `take` *(number): Required.* Max number of messages that should be taken. Starts from 1.
- `cb(err, result)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).*
  - `result.total` *(number).* Total messages that has been scheduled so far.
  - `result.items` *(Array).* An array of pending messages with priority.

### MessageManager.prototype.getDeadLetterMessages()

```javascript
getDeadLetterMessages(queue, skip, take, cb);
```

**Parameters**

- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used. 
Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `skip` *(number): Required.* Offset from where messages should be taken. Starts from 0.
- `take` *(number): Required.* Max number of messages that should be taken. Starts from 1.
- `cb(err, result)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).*
  - `result.total` *(number).* Total messages that has been scheduled so far.
  - `result.items` *(Array).* An array of scheduled messages.
    - `result.items[*].sequenceId` *(number).* Message sequence ID.
    - `result.items[*].message` *(Message).* The stored message at the sequence ID.

### MessageManager.prototype.getPendingMessages()

```javascript
getPendingMessages(queue, skip, take, cb);
```

**Parameters**

- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used. 
Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `skip` *(number): Required.* Offset from where messages should be taken. Starts from 0.
- `take` *(number): Required.* Max number of messages that should be taken. Starts from 1.
- `cb(err, result)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).*
  - `result.total` *(number).* Total messages that has been scheduled so far.
  - `result.items` *(Array).* An array of scheduled messages.
    - `result.items[*].sequenceId` *(number).* Message sequence ID.
    - `result.items[*].message` *(Message).* The stored message at the sequence ID.

### MessageManager.prototype.getAcknowledgedMessages()

```javascript
getAcknowledgedMessages(queue, skip, take, cb);
```

**Parameters**

- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used. 
Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `skip` *(number): Required.* Offset from where messages should be taken. Starts from 0.
- `take` *(number): Required.* Max number of messages that should be taken. Starts from 1.
- `cb(err, result)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).*
  - `result.total` *(number).* Total messages that has been scheduled so far.
  - `result.items` *(Array).* An array of scheduled messages.
    - `result.items[*].sequenceId` *(number).* Message sequence ID.
    - `result.items[*].message` *(Message).* The stored message at the sequence ID.

### MessageManager.prototype.deletePendingMessageWithPriority()

```javascript
deletePendingMessageWithPriority(queue, messageId, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used. 
Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `messageId` *(string): Required.* Message ID.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.deleteDeadLetterMessage()

```javascript
deleteDeadLetterMessage(queue, sequenceId, messageId, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used. 
Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `sequenceId` *(number): Required.* Message sequence ID.
- `messageId` *(string): Required.* Message ID.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.deleteAcknowledgedMessage()

```javascript
deleteAcknowledgedMessage(queue, sequenceId, messageId, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used. 
Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `sequenceId` *(number): Required.* Message sequence ID.
- `messageId` *(string): Required.* Message ID.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.deletePendingMessage()

```javascript
deletePendingMessage(queue, sequenceId, messageId, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used. 
Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `sequenceId` *(number): Required.* Message sequence ID.
- `messageId` *(string): Required.* Message ID.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.deleteScheduledMessage()

```javascript
deleteScheduledMessage(messageId, cb);
```

**Parameters**
- `messageId` *(string): Required.* Message ID.
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.requeueMessageFromDLQueue()

```javascript
requeueMessageFromDLQueue(queue, sequenceId, messageId, priority, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used.
  Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `sequenceId` *(number): Required.* Message sequence ID.
- `messageId` *(string): Required.* Message ID.
- `priority` *(number|undefined): Required.* Message priority.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.requeueMessageFromAcknowledgedQueue()

```javascript
requeueMessageFromAcknowledgedQueue(queue, sequenceId, messageId, priority, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used.
  Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `sequenceId` *(number): Required.* Message sequence ID.
- `messageId` *(string): Required.* Message ID.
- `priority` *(number|undefined): Required.* Message priority.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.quit()

```javascript
quit(cb);
```

**Parameters**
- `cb` *(Function): Required.* Callback function.
