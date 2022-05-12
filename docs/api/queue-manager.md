# Queue Manager API

```javascript
const { QueueManager } = require('redis-smq');
```

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

#### QueueManager.prototype.queue.create()

```javascript
create(queue, priorityQueuing, cb);
```

**Parameters**
- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `priorityQueuing` *(boolean): Required.* Enable/disable priority queuing.
- `cb(err)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.

The queue name can be composed only of letters (a-z), numbers (0-9) and (-_) characters.

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
    - `queueMetrics.pendingWithPriority` *(number).* Pending messages with priority count.

## Public Methods

### QueueManager.prototype.quit()

```javascript
quit(cb);
```

**Parameters**
- `cb` *(Function): Required.* Callback function.


