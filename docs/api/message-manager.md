# Message Manager API

> ☝ ️By default, acknowledged and dead-lettered messages are not stored. If you need such feature, you can enable it from your [configuration](/docs/configuration.md) object.

```javascript
const { MessageManager } = require('redis-smq');
```

## Table of Content

1. [Public Static Methods](#public-static-methods) 
   1. [MessageManager.getSingletonInstance()](#messagemanagergetsingletoninstance)
2. [Public Properties](#public-properties)
   1. [Properties](#properties)
      1. [MessageManager.prototype.scheduledMessages](#messagemanagerprototypescheduledmessages)
      2. [MessageManager.prototype.pendingMessages](#messagemanagerprototypependingmessages)
      3. [MessageManager.prototype.acknowledgedMessages](#messagemanagerprototypeacknowledgedmessages)
      4. [MessageManager.prototype.deadLetteredMessages](#messagemanagerprototypedeadletteredmessages) 
   2. [Methods Description](#methods-description) 
      1. [list()](#list)
      2. [delete()](#delete)
      3. [purge()](#purge)
      4. [requeue()](#requeue)
      5. [count()](#count)
3. [Public Methods](#public-methods) 
   1. [MessageManager.prototype.quit()](#messagemanagerprototypequit)     
   
## Public Static Methods

### MessageManager.getSingletonInstance()

Obtain a MessageManager instance.

```javascript
getSingletonInstance(cb)
```

**Parameters**
- `cb(err, messageManager)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `messageManager` *(MessageManager).* MessageManager instance.

**Example**
```javascript
const { MessageManager } = require('redis-smq');

MessageManager.getSingletonInstance((err, messageManager) => {
  if (err) console.log(err);
  else {
    // ...
  }
})
```

## Public Properties

### Properties

#### MessageManager.prototype.scheduledMessages

* [MessageManager.prototype.scheduledMessages.list()](#list)
* [MessageManager.prototype.scheduledMessages.delete()](#delete)
* [MessageManager.prototype.scheduledMessages.purge()](#purge)

##### MessageManager.prototype.scheduledMessages.count()

```javascript
count(cb);
```

**Parameters**
- `cb(err, reply)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.
    - `reply` *(number | null | undefined).* Message count.

#### MessageManager.prototype.pendingMessages

* [MessageManager.prototype.pendingMessages.list()](#list)
* [MessageManager.prototype.pendingMessages.delete()](#delete)
* [MessageManager.prototype.pendingMessages.purge()](#purge)
* [MessageManager.prototype.pendingMessages.count()](#count)

#### MessageManager.prototype.acknowledgedMessages

* [MessageManager.prototype.acknowledgedMessages.list()](#list)
* [MessageManager.prototype.acknowledgedMessages.delete()](#delete)
* [MessageManager.prototype.acknowledgedMessages.purge()](#purge)
* [MessageManager.prototype.acknowledgedMessages.requeue()](#requeue)
* [MessageManager.prototype.acknowledgedMessages.count()](#count)

#### MessageManager.prototype.deadLetteredMessages

* [MessageManager.prototype.deadLetteredMessages.list()](#list)
* [MessageManager.prototype.deadLetteredMessages.delete()](#delete)
* [MessageManager.prototype.deadLetteredMessages.purge()](#purge)
* [MessageManager.prototype.deadLetteredMessages.requeue()](#requeue)
* [MessageManager.prototype.deadLetteredMessages.count()](#count)

### Methods Description

#### list()

```javascript
list( queue, skip, take, cb);
```

**Parameters**
- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
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

#### delete()

```javascript
delete(queue, messageId, sequenceId, cb);
```

**Parameters**
- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `messageId` *(string): Required.* Message ID.
- `sequenceId` *(number): Required.* Message sequence ID.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

#### purge()

```javascript
purge(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.


#### requeue()

```javascript
requeue(queue, messageId, sequenceId, cb);
```

**Parameters**
- `queue` *(string|object): Required.*  
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `messageId` *(string): Required.* Message ID.
- `sequenceId` *(number): Required.* Message sequence ID.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### count()

```javascript
count(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.*
    - `queue` *(string)*. Queue name. Default namespace will be used.
    - `queue` *(object)*. You can also provide a queue name and a namespace.
        - `queue.name` *(string): Required.* Queue name.
        - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err, reply)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.
    - `reply` *(number | null | undefined).* Message count.

## Public Methods

### MessageManager.prototype.quit()

Shut down and disconnect from Redis server.

```javascript
quit(cb);
```

**Parameters**
- `cb` *(Function): Required.* Callback function.
