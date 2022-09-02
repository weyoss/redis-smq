# FanOutExchangeManager

## Table of Content

1. [Public Static Methods](#public-static-methods)
    1. [FanOutExchangeManager.createInstance()](#fanoutexchangemanagercreateinstance)
2. [Public Methods](#public-methods)
   1. [FanOutExchangeManager.prototype.bindQueueToExchange()](#fanoutexchangemanagerprototypebindqueuetoexchange)
   2. [FanOutExchangeManager.prototype.unbindQueueFromExchange()](#fanoutexchangemanagerprototypeunbindqueuefromexchange) 
   3. [FanOutExchangeManager.prototype.getQueueExchangeBinding()](#fanoutexchangemanagerprototypegetqueueexchangebinding) 
   4. [FanOutExchangeManager.prototype.getExchangeBindings()](#fanoutexchangemanagerprototypegetexchangebindings) 
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

### FanOutExchangeManager.prototype.bindQueueToExchange()

TODO

### FanOutExchangeManager.prototype.unbindQueueFromExchange()

TODO

### FanOutExchangeManager.prototype.getQueueExchangeBinding()

TODO

### FanOutExchangeManager.prototype.getExchangeBindings()

TODO

### FanOutExchangeManager.prototype.quit()

```javascript
quit(cb);
```

**Parameters**
- `cb` *(Function): Required.* Callback function.