# FanOutExchangeManager

## Table of Content

1. [Public Static Methods](#public-static-methods)
    1. [FanOutExchangeManager.createInstance()](#fanoutexchangemanagercreateinstance)
2. [Public Methods](#public-methods)
   1. [FanOutExchangeManager.prototype.bindQueue()](#fanoutexchangemanagerprototypebindqueue)
   2. [FanOutExchangeManager.prototype.unbindQueue()](#fanoutexchangemanagerprototypeunbindqueue) 
   3. [FanOutExchangeManager.prototype.getQueueExchange()](#fanoutexchangemanagerprototypegetqueueexchange) 
   4. [FanOutExchangeManager.prototype.getExchangeQueues()](#fanoutexchangemanagerprototypegetexchangequeues) 
   5. [FanOutExchangeManager.prototype.quit()](#fanoutexchangemanagerprototypequit)

## Public Static Methods

### FanOutExchangeManager.createInstance()

```javascript
createInstance(config, cb)
```

**Parameters**

- `config` *(object): Optional.*  See [Configuration](/docs/configuration.md) for more details.
- `cb(err, fanOutExchangeManager)` *(Function): Required.* Callback function.
  - `err` *(Error | null | undefined).* Error object.
  - `fanOutExchangeManager` *(FanOutExchangeManager).* FanOutExchangeManager instance.

**Example**

```javascript
const { FanOutExchangeManager } = require('redis-smq');

FanOutExchangeManager.createInstance(config, (err, fanOutExchangeManager) => {
  if (err) console.log(err);
  else {
    // ...
  }
})
```

## Public Methods

### FanOutExchangeManager.prototype.bindQueue()

```typescript
bindQueue(queue, exchange, cb);
```

**Parameters**

- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `exchange` *(object): required*. FanOutExchange instance.
- `cb(err)` *(function): Required.*
    - `err` *(Error | null | undefined)*.
### FanOutExchangeManager.prototype.unbindQueue()

```typescript
unbindQueue(queue, exchange, cb);
```

**Parameters**


- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `exchange` *(object): required*. FanOutExchange instance.
- `cb(err)` *(function): Required.*
    - `err` *(Error | null | undefined)*.
### FanOutExchangeManager.prototype.getQueueExchange()


```typescript
getQueueExchange(queue, cb);
```

**Parameters**

- `queue` *(string|object): Required.*
  - `queue` *(string)*. Queue name. Default namespace will be used.
  - `queue` *(object)*. You can also provide a queue name and a namespace.
    - `queue.name` *(string): Required.* Queue name.
    - `queue.ns` *(string): Required.* Queue namespace.
- `cb(err, exchange)` *(function): Required.*
    - `err` *(Error | null | undefined)*.
    - `exchange` *(object | null | undefined)*. FanOutExchange instance.

### FanOutExchangeManager.prototype.getExchangeQueues()


```typescript
getExchangeQueues(exchange, cb);
```

**Parameters**

- `exchange` *(object): required*. FanOutExchange instance. 
- `cb(err, queues)` *(function): required*. Callback function.
  - `err` *(Error | null | undefined)*.
  - `queues` *(array)*.
    - `queues.*.name` *(string): Required.* Queue name.
    - `queue.*.ns` *(string): Required.* Queue namespace.

### FanOutExchangeManager.prototype.quit()

```javascript
quit(cb);
```

**Parameters**
- `cb` *(Function): Required.* Callback function.