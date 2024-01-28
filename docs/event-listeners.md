[RedisSMQ](../README.md) / [Docs](README.md) / Event listeners

# Event listeners

Event listeners is a way to automate processing every event from each consumer or producer instance.

Let's suppose that for some reason you want to catch all `messageAcknowledged` events from all created consumer instances in your application.

There are many ways to take in order to achieve this goal. The most repetitive and error prone way is to manually register an event listener after creating each consumer instance like this way:

```javascript
const consumer = new Consumer();
consumer.on('messageAcknowledged', (messageId, queue, messageHandlerId, consumerId) => {
  //...
})
```

A more convenient way to do the same thing but with less manual work is to configure RedisSMQ to initialize and manage event listeners for you.

## Usage

### Creating Event Listeners

Let's create an event listener class which we will use to demonstrate how to work with event listeners.

```typescript
import { IEventListener, TRedisSMQEvent } from 'redis-smq';
import { ICallback, EventEmitter } from "redis-smq-common";

class MyEventListener extends EventEmitter<TRedisSMQEvent> implements IEventListener {  
  init(cb: ICallback<void>) {
    this.on('messageAcknowledged', (messageId, queue, messageHandlerId, consumerId) => {
      //...
    })
  }

  quit(cb: ICallback<void>) {
    // Clean up before quiting
    // ...
  }
}
```

Each time you create a Consumer or Producer instance, under the hood, RedisSMQ initializes the provided event listeners and manages them until the instance is destroyed.

An event listener implements the [`IEventListener`](api/interfaces/IEventListener.md) interface.

The [`init()`](api/interfaces/IEventListener.md#init) is intended to perform any initialization steps that your event listener may need.

The [`quit()`](api/interfaces/IEventListener.md#quit) method is required to gracefully shut down your event listener instance when a consumer/producer goes down.

### Registering Event Listeners

Using a configuration object, RedisSMQ allows you to register one or many event listener classes as shown in the example bellow:

```typescript
import { IConfig, Configuration } from 'redis-smq';

const config: IConfig = {
  eventListeners: [MyEventListener]
}

Configuration.getSetConfig(config);
```

See [`IRedisSMQConfig`](api/interfaces/IRedisSMQConfig.md) for more details.

### Events

An event listener allows subscribing to the following events:

- `messagePublished`
- `messageAcknowledged`
- `messageUnacknowledged`
- `messageDeadLettered`

See [TRedisSMQEvent](api/README.md#tredissmqevent) for more details.
