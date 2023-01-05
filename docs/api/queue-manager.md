# Queue Manager API

```javascript
const { QueueManager } = require('redis-smq');
```

## Table of Content

1. [Public Static Methods](#public-static-methods)
   1. [QueueManager.createInstance()](#queuemanagercreateinstance)
2. [Public Properties](#public-properties)
   1. [QueueManager.prototype.namespace](#queuemanagerprototypenamespace)
      1. [QueueManager.prototype.namespace.list()](#queuemanagerprototypenamespacelist)
      2. [QueueManager.prototype.namespace.getQueues()](#queuemanagerprototypenamespacegetqueues)
      3. [QueueManager.prototype.namespace.delete()](#queuemanagerprototypenamespacedelete)
   2. [QueueManager.prototype.queue](#queuemanagerprototypequeue)
      1. [QueueManager.prototype.queue.save()](#queuemanagerprototypequeuesave)
      2. [QueueManager.prototype.queue.create()](#queuemanagerprototypequeuecreate)
      3. [QueueManager.prototype.queue.list()](#queuemanagerprototypequeuelist)
      4. [QueueManager.prototype.queue.delete()](#queuemanagerprototypequeuedelete)
      5. [QueueManager.prototype.queue.exists()](#queuemanagerprototypequeueexists)
      6. [QueueManager.prototype.queue.getSettings()](#queuemanagerprototypequeuegetsettings)
   3. [QueueManager.prototype.queueRateLimit](#queuemanagerprototypequeueratelimit)
      1. [QueueManager.prototype.queueRateLimit.set()](#queuemanagerprototypequeueratelimitset)
      2. [QueueManager.prototype.queueRateLimit.clear()](#queuemanagerprototypequeueratelimitclear)
      3. [QueueManager.prototype.queueRateLimit.get()](#queuemanagerprototypequeueratelimitget)
   4. [QueueManager.prototype.queueMetrics](#queuemanagerprototypequeuemetrics)
      1. [QueueManager.prototype.queueMetrics.getMetrics()](#queuemanagerprototypequeuemetricsgetmetrics)
3. [Public Methods](#public-methods)
   1. [QueueManager.prototype.quit()](#queuemanagerprototypequit)

## Public Static Methods

### QueueManager.createInstance()

```javascript
createInstance(config, cb)
```

**Parameters**
- `config` *(object): Optional.*  See [Configuration](/docs/configuration.md) for more details.
- `cb(err, queueManager)` *(Function): Required.* Callback function.
    - `err` *(Error | null | undefined).* Error object.
    - `queueManager` *(QueueManager).* QueueManager instance.

**Example**

```javascript
const { QueueManager } = require('redis-smq');
const config = require('./config');

QueueManager.createInstance(config, (err, queueManager) => {
  if (err) console.log(err);
  else {
    // ...
  }
})
```

## Public Properties

### QueueManager.prototype.namespace

#### QueueManager.prototype.namespace.list()

```javascript
list(cb);
```

**Parameters**
- `cb(err, namespaces)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `namespaces` *(Array).* Namespaces.

#### QueueManager.prototype.namespace.getQueues()

```javascript
getQueues(ns, cb);
```

**Parameters**

- `ns` *(string): Required.* Namespace.
- `cb(err, messageQueues)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `messageQueues` *(Array).*
    - `messageQueues[*].ns` *(string).* Queue namespace.
    - `messageQueues[*].name` *(string).* Queue name.

#### QueueManager.prototype.namespace.delete()

```javascript
delete(ns, cb);
```

**Parameters**

- `ns` *(string): Required.* Namespace.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

Before deleting a namespace, make sure that all queues from the given namespace are not being in use. Otherwise, an error will be returned.

### QueueManager.prototype.queue

#### QueueManager.prototype.queue.save()

```javascript
save(queue, queueType, cb);
```

**Parameters**
- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `queueType` *(number): Required.* Queue type. Possible values are: EQueueType.LIFO_QUEUE, EQueueType.FIFO_QUEUE, and EQueueType.PRIORITY_QUEUE.
- `cb(err, reply)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `reply` *(object | null | undefined)*
    - `reply.queue` *(object)*
      - `queue.name` *(string): Required.* Queue name.
      - `queue.ns` *(string): Required.* Queue namespace.
    - `reply.settings` *(object)*. Queue settings
      - `reply.settings.priorityQueuing` *(boolean)*. Whether priority queuing is enabled.
      - `reply.settings.rateLimit` *(object|null)*. Queue rate limit.
        - `reply.settings.rateLimit.limit` *(number): Required.* The maximum number of messages within an `interval`.
        - `reply.settings.rateLimit.interval` *(number): Required.* The timespan for `limit` in milliseconds.
      - `reply.settings.exchange` *(string|null)*. The fanout exchange to which the queue is bound.

See [Queue Naming Requirements](/docs/queues.md#queue-naming-requirements).

```javascript
const { QueueManager } = require('redis-smq');
const { EQueueType } = require('redis-smq/dist/types');
const config = require('./config')

QueueManager.createInstance(config, (err, queueManager) => {
  if (err) console.log(err);
  // Creating a FIFO queue
  else queueManager.queue.save('test_queue', EQueueType.FIFO_QUEUE, (err) => console.log(err));
})
```


#### QueueManager.prototype.queue.create()

**DEPRECATED**. This method is kept for backward compatibility, and it will be removed in the next major release. Use [QueueManager.prototype.queue.save()](#queuemanagerprototypequeuesave) instead.

```javascript
create(queue, priorityQueuing, cb);
```

**Parameters**
- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `priorityQueuing` *(boolean): Required.* Enable/disable priority queuing. When priorityQueuing = false, a LIFO queue will be created.
- `cb(err, reply)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `reply` *(object | null | undefined)*
    - `reply.queue` *(object)*
      - `queue.name` *(string): Required.* Queue name.
      - `queue.ns` *(string): Required.* Queue namespace.
    - `reply.settings` *(object)*. Queue settings
      - `reply.settings.priorityQueuing` *(boolean)*. Whether priority queuing is enabled.
      - `reply.settings.rateLimit` *(object|null)*. Queue rate limit.
          - `reply.settings.rateLimit.limit` *(number): Required.* The maximum number of messages within an `interval`.
          - `reply.settings.rateLimit.interval` *(number): Required.* The timespan for `limit` in milliseconds.
      - `reply.settings.exchange` *(string|null)*. The fanout exchange to which the queue is bound.

See [Queue Naming Requirements](/docs/queues.md#queue-naming-requirements).

#### QueueManager.prototype.queue.list()

```javascript
list(cb);
```

**Parameters**
- `cb(err, messageQueues)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `messageQueues` *(Array).*
    - `messageQueues[*].ns` *(string).* Queue namespace.
    - `messageQueues[*].name` *(string).* Queue name.

#### QueueManager.prototype.queue.delete()

```javascript
delete(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

Before deleting a message queue, make sure that the given queue is not being in use. Otherwise, an error will be returned.

#### QueueManager.prototype.queue.exists()

```javascript
exists(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err, reply)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `reply` *(boolean)*

#### QueueManager.prototype.queue.getSettings()

```javascript
getSettings(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err, settings)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `settings` *(object)*
    - `settings.type` *(number)*. Queue type.
    - `settings.rateLimit` *(object|null)*. Queue rate limit.
      - `settings.rateLimit.limit` *(number): Required.* The maximum number of messages within an `interval`.
      - `settings.rateLimit.interval` *(number): Required.* The timespan for `limit` in milliseconds.
    - `settings.exchange` *(string|null)*. The fanout exchange to which the queue is bound.

### QueueManager.prototype.queueRateLimit

#### QueueManager.prototype.queueRateLimit.set()

```javascript
set(queue, rateLimit, cb);
```

**Parameters**
- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `rateLimit` *(object): Required.*
  - `rateLimit.limit` *(number): Required.* The maximum number of messages within an `interval`.
  - `rateLimit.interval` *(number): Required.* The timespan for `limit` in milliseconds.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

#### QueueManager.prototype.queueRateLimit.clear()

```javascript
clear(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.*
  - `queue` *(string)* Queue name. Default namespace will be used.
  - `queue` *(object)* You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

#### QueueManager.prototype.queueRateLimit.get()

```javascript
get(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err, rateLimit)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `rateLimit` *(object|null): Required.*
    - `rateLimit` *(null)* Rate limit is not set.
    - `rateLimit` *(object)* Existing rate limit.
      - `rateLimit.limit` *(number): Required.* The maximum number of messages within an `interval`.
      - `rateLimit.interval` *(number): Required.* The timespan for `limit` in milliseconds.

### QueueManager.prototype.queueMetrics

#### QueueManager.prototype.queueMetrics.getMetrics()

```javascript
getMetrics(queue, cb);
```

**Parameters**
- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err, queueMetrics)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `queueMetrics` *(object).* Queue metrics.
    - `queueMetrics.acknowledged` *(number).* Acknowledged messages count.
    - `queueMetrics.deadLettered` *(number).* Dead-lettered messages count.
    - `queueMetrics.pending` *(number).* Pending messages count.

## Public Methods

### QueueManager.prototype.quit()

```javascript
quit(cb);
```

**Parameters**
- `cb` *(Function): Required.* Callback function.


