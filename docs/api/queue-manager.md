# Queue Manager API

```javascript
const { QueueManager } = require('redis-smq');
```

## Table of Content

1. [QueueManager.getSingletonInstance()](#queuemanagergetsingletoninstance)
2. [QueueManager.prototype.getQueues()](#queuemanagerprototypegetqueues)
3. [QueueManager.prototype.getNamespaces()](#queuemanagerprototypegetnamespaces)
4. [QueueManager.prototype.getNamespaceQueues()]()
5. [QueueManager.prototype.getQueueMetrics()](#queuemanagerprototypegetqueuemetrics)
6. [QueueManager.prototype.deleteQueue()](#queuemanagerprototypedeletequeue)
7. [QueueManager.prototype.deleteNamespace()](#queuemanagerprototypedeletenamespace)
8. [QueueManager.prototype.setQueueRateLimit()](#queuemanagerprototypesetqueueratelimit)
9. [QueueManager.prototype.clearQueueRateLimit()](#queuemanagerprototypeclearqueueratelimit)
10. [QueueManager.prototype.getQueueRateLimit()](#queuemanagerprototypegetqueueratelimit)
11. [QueueManager.prototype.quit()](#queuemanagerprototypequit)

## Public Static Methods

### QueueManager.getSingletonInstance()

```javascript
getSingletonInstance(cb)
```

**Parameters**
- `cb(err, queueManager)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.
    - `queueManager` *(QueueManager).* QueueManager instance.

**Example**

```javascript
const { QueueManager } = require('redis-smq');

QueueManager.getSingletonInstance((err, queueManager) => {
  if (err) console.log(err);
  else {
    // ...
  }
})
```

## Public Methods

### QueueManager.prototype.getQueues()

```javascript
getQueues(cb);
```

**Parameters**
- `cb(err, messageQueues)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `messageQueues` *(Array).*
    - `messageQueues[*].ns` *(string).* Queue namespace.
    - `messageQueues[*].name` *(string).* Queue name.

### QueueManager.prototype.getNamespaces()

```javascript
getNamespaces(cb);
```

**Parameters**
- `cb(err, namespaces)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `namespaces` *(Array).* Namespaces.

### QueueManager.prototype.getNamespaceQueues()

```javascript
getNamespaceQueues(ns, cb);
```

**Parameters**

- `ns` *(string): Required.* Namespace.
- `cb(err, messageQueues)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `messageQueues` *(Array).*
    - `messageQueues[*].ns` *(string).* Queue namespace.
    - `messageQueues[*].name` *(string).* Queue name.

### QueueManager.prototype.getQueueMetrics()

```javascript
getQueueMetrics(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.*  
  - `queue` *(string): Required.* Queue name. Default namespace will be used.
  - `queue` *(object): Required.* You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err, queueMetrics)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `queueMetrics` *(object).* Queue metrics.
    - `queueMetrics.acknowledged` *(number).* Acknowledged messages count.
    - `queueMetrics.deadLettered` *(number).* Dead-lettered messages count.
    - `queueMetrics.pending` *(number).* Pending messages count.
    - `queueMetrics.pendingWithPriority` *(number).* Pending messages with priority count.

### QueueManager.prototype.deleteQueue()

```javascript
deleteQueue(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.*  
  - `queue` *(string): Required.* Queue name. Default namespace will be used.
  - `queue` *(object): Required.* You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

Before deleting a message queue, make sure that the given queue is not being in use. Otherwise, an error will be returned.

### QueueManager.prototype.deleteNamespace()

```javascript
deleteNamespace(ns, cb);
```

**Parameters**

- `ns` *(string): Required.* Namespace.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

Before deleting a namespace, make sure that all queues from the given namespace are not being in use. Otherwise, an error will be returned.

### QueueManager.prototype.setQueueRateLimit()

```javascript
setQueueRateLimit(queue, rateLimit, cb);
```

**Parameters**
- `queue` *(string|object): Required.*  
  - `queue` *(string): Required.* Queue name. Default namespace will be used.
  - `queue` *(object): Required.* You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `rateLimit` *(object): Required.*
  - `rateLimit.limit` *(number): Required.* The maximum number of messages within an `interval`.
  - `rateLimit.interval` *(number): Required.* The timespan for `limit` in milliseconds.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.clearQueueRateLimit()

```javascript
clearQueueRateLimit(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.*  
  - `queue` *(string): Required.* Queue name. Default namespace will be used.
  - `queue` *(object): Required.* You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

### QueueManager.prototype.getQueueRateLimit()

```javascript
getQueueRateLimit(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.*  
  - `queue` *(string): Required.* Queue name. Default namespace will be used.
  - `queue` *(object): Required.* You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err, rateLimit)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `rateLimit` *(object): Required.*
    - `rateLimit.limit` *(number): Required.* The maximum number of messages within an `interval`.
    - `rateLimit.interval` *(number): Required.* The timespan for `limit` in milliseconds.

### QueueManager.prototype.quit()

```javascript
quit(cb);
```

**Parameters**
- `cb` *(Function): Required.* Callback function.


