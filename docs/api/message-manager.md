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

## Table of Content

1. Obtaining a MessageManager instance
   1. [MessageManager.getSingletonInstance()](#messagemanagergetsingletoninstance)

2. Managing Scheduled Messages
   1. [MessageManager.prototype.getScheduledMessages()](#messagemanagerprototypegetscheduledmessages)
   2. [MessageManager.prototype.deleteScheduledMessage()](#messagemanagerprototypedeletescheduledmessage)
   3. [MessageManager.prototype.purgeScheduledMessages()](#messagemanagerprototypepurgescheduledmessages)
   
3. Managing Pending Messages
   1. [MessageManager.prototype.getPendingMessages()](#messagemanagerprototypegetpendingmessages)
   2. [MessageManager.prototype.deletePendingMessage()](#messagemanagerprototypedeletependingmessage)
   3. [MessageManager.prototype.purgePendingMessages()](#messagemanagerprototypepurgependingmessages)

4. Managing Pending Messages with Priority
   1. [MessageManager.prototype.getPendingMessagesWithPriority()](#messagemanagerprototypegetpendingmessageswithpriority)
   2. [MessageManager.prototype.deletePendingMessageWithPriority()](#messagemanagerprototypedeletependingmessagewithpriority)
   3. [MessageManager.prototype.purgePendingMessagesWithPriority()](#messagemanagerprototypepurgependingmessageswithpriority)
   
5. Managing Acknowledged Messages
   1. [MessageManager.prototype.getAcknowledgedMessages()](#messagemanagerprototypegetacknowledgedmessages)
   2. [MessageManager.prototype.requeueAcknowledgedMessage()](#messagemanagerprototyperequeueacknowledgedmessage)
   3. [MessageManager.prototype.deleteAcknowledgedMessage()](#messagemanagerprototypedeleteacknowledgedmessage)
   4. [MessageManager.prototype.purgeAcknowledgedMessages()](#messagemanagerprototypepurgeacknowledgedmessages)
   
6. Managing Dead-Lettered Messages
   1. [MessageManager.prototype.getDeadLetteredMessages()](#messagemanagerprototypegetdeadletteredmessages)
   2. [MessageManager.prototype.requeueDeadLetteredMessage()](#messagemanagerprototyperequeuedeadletteredmessage)
   3. [MessageManager.prototype.deleteDeadLetteredMessage()](#messagemanagerprototypedeletedeadletteredmessage)
   4. [MessageManager.prototype.purgeDeadLetteredMessages()](#messagemanagerprototypepurgedeadletteredmessages)
   
7. Shutting down and disconnecting from Redis server
   1. [MessageManager.prototype.quit()](#messagemanagerprototypequit)
   
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

### MessageManager.prototype.deleteScheduledMessage()

```javascript
deleteScheduledMessage(messageId, cb);
```

**Parameters**
- `messageId` *(string): Required.* Message ID.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.purgeScheduledMessages()

```javascript
purgeScheduledMessages(cb);
```

**Parameters**
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

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

### MessageManager.prototype.purgePendingMessages()

```javascript
purgePendingMessages(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used.
  Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

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

### MessageManager.prototype.purgePendingMessagesWithPriority()

```javascript
purgePendingMessagesWithPriority(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used.
  Otherwise, you can explicity provide an object which has the following signature:
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.

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

### MessageManager.prototype.requeueAcknowledgedMessage()

```javascript
requeueAcknowledgedMessage(queue, sequenceId, messageId, priority, cb);
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

### MessageManager.prototype.purgeAcknowledgedMessages()

```javascript
purgeAcknowledgedMessages(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used.
  Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.getDeadLetteredMessages()

```javascript
getDeadLetteredMessages(queue, skip, take, cb);
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

### MessageManager.prototype.requeueDeadLetteredMessage()

```javascript
requeueDeadLetteredMessage(queue, sequenceId, messageId, priority, cb);
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

### MessageManager.prototype.deleteDeadLetteredMessage()

```javascript
deleteDeadLetteredMessage(queue, sequenceId, messageId, cb);
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

### MessageManager.prototype.purgeDeadLetteredMessages()

```javascript
purgeDeadLetteredMessages(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.* Queue parameters. When you provide the queue name then the default namespace will be used.
  Otherwise, you can explicity provide an object which has the following signature:
  - `queue.name` *(string): Required.* Queue name.
  - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### MessageManager.prototype.quit()

```javascript
quit(cb);
```

**Parameters**
- `cb` *(Function): Required.* Callback function.
