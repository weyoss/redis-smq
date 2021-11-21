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
getPendingMessagesWithPriority(queueName, ns, skip, take, cb);
```

**Parameters**

- `queueName` *(string): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your 
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
- `skip` *(number): Required.* Offset from where messages should be taken. Starts from 0.
- `take` *(number): Required.* Max number of messages that should be taken. Starts from 1.
- `cb(err, result)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).*
  - `result.total` *(number).* Total messages that has been scheduled so far.
  - `result.items` *(Array).* An array of pending messages with priority.

### MessageManager.prototype.getDeadLetterMessages()

```javascript
getDeadLetterMessages(queueName, ns, skip, take, cb);
```

**Parameters**

- `queueName` *(string): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
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
getPendingMessages(queueName, ns, skip, take, cb);
```

**Parameters**

- `queueName` *(string): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
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
getAcknowledgedMessages(queueName, ns, skip, take, cb);
```

**Parameters**

- `queueName` *(string): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
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
deletePendingMessageWithPriority(queueName, ns, messageId, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
- `messageId` *(string): Required.* Message ID.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.deleteDeadLetterMessage()

```javascript
deleteDeadLetterMessage(queueName, ns, sequenceId, messageId, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
- `sequenceId` *(number): Required.* Message sequence ID.
- `messageId` *(string): Required.* Message ID.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.deleteAcknowledgedMessage()

```javascript
deleteAcknowledgedMessage(queueName, ns, sequenceId, messageId, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
- `sequenceId` *(number): Required.* Message sequence ID.
- `messageId` *(string): Required.* Message ID.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.deletePendingMessage()

```javascript
deletePendingMessage(queueName, ns, sequenceId, messageId, cb);
```

**Parameters**
- `queueName` *(string): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
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
requeueMessageFromDLQueue(queueName, ns, sequenceId, messageId, withPriority, priority, cb);
```

**Parameters**
- `queueName` *(number): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
- `sequenceId` *(number): Required.* Message sequence ID.
- `messageId` *(string): Required.* Message ID.
- `withPriority` *(boolean): Required.* Whether to enqueue the message with priority.
- `priority` *(number|undefined): Required.* Message priority.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.requeueMessageFromAcknowledgedQueue()

```javascript
requeueMessageFromAcknowledgedQueue(queueName, ns, sequenceId, messageId, withPriority, priority, cb);
```

**Parameters**
- `queueName` *(number): Required.* Queue name.
- `ns` *(string | undefined): Required.* Queue namespace. To use the default namespace or the namespace from your
  configuration object, set `ns` to `undefined`. Otherwise, provide a valid namespace.
- `sequenceId` *(number): Required.* Message sequence ID.
- `messageId` *(string): Required.* Message ID.
- `withPriority` *(boolean): Required.* Whether to enqueue the message with priority.
- `priority` *(number|undefined): Required.* Message priority.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.quit()

```javascript
quit(cb);
```

**Parameters**
- `cb` *(Function): Required.* Callback function.
