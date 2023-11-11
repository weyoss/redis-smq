[RedisSMQ](../README.md) / [Docs](README.md) / Event listeners

# Event listeners

Event listeners can be a way to automate processing every event from each consumer or producer instance.

Let's suppose that for some reason you want to catch all `events.MESSAGE_ACKNOWLEDGED` events from all created 
consumer instances in your application.

There are many ways to take in order to achieve your goal. The most repetitive and error prone way is to manually 
register an event listener after creating each consumer instance like this way:

```javascript
const consumer = new Consumer();
consumer.on(events.MESSAGE_ACKNOWLEDGED, (msg) => {
  //...
})
```

A more convenient way to do the same thing but with less manual work, is to configure RedisSMQ to initialize and 
manage event listeners for you.

## Consumer Event Listeners

Let's create a consumer event listener class which we will use to demonstrate how to work with consumer event listeners.

```typescript
import { IEventListener, IEventProvider, TEventListenerInitArgs } from 'redis-smq';
import { events } from 'redis-smq';
import { ICallback } from "redis-smq-common";

export class ConsumerEventListener implements IEventListener {
  init(
    args: TEventListenerInitArgs,
    cb: ICallback<void>
  ) {
    // ...
  }

  quit(cb: ICallback<void>) {
    // Clean up before quiting
    // ...
  }
}
```

Each time you create a consumer instance, under the hood, RedisSMQ initializes the provided event listeners and manages them until the instance is destroyed.

A consumer event listener class implements the `IEventListener` interface:

```typescript
interface IEventListener {
  init(args: TEventListenerInitArgs, cb: ICallback<void>): void;
  quit(cb: ICallback<void>): void;
}
```

You may use the `init()` to perform any initialization steps that your listener may need.

The first argument of the `init()` method (`args`) is an object which provides:

- `args.instanceId`: The ID of the consumer/producer instance.
- `args.eventProvider`: An event emitter instance which emits all event from the given instance.
- `args.config`: The configuration that is being in use and that may be used in your event listener instance initialization.

The `quit()` method is required to gracefully shut down your event listener instance when a consumer/producer goes down.

Using a configuration object, RedisSMQ allows you to register one or many event listener classes as shown in the example bellow:

```typescript
import { IConfig, Configuration } from 'redis-smq';

const config: IConfig = {
  eventListener: {
    consumerEventListeners: [ConsumerEventListener]
  }
}

Configuration.getSetConfig(config);
```

### Consumer Message Events:

* events.MESSAGE_RECEIVED
* events.MESSAGE_ACKNOWLEDGED
* events.MESSAGE_UNACKNOWLEDGED
* events.MESSAGE_DEAD_LETTERED

## Producer Event Listeners

The producer event listener class also implements the `IEventListener` interface: 

Example:

```typescript
import { IEventListener, IEventProvider, events } from 'redis-smq';

export class ProducerEventListener implements IEventListener {
  init(args: TEventListenerInitArgs, cb: ICallback<void>) {
    // ...
  }

  quit(cb: ICallback<void>) {
    // ...
  }
}
```

Similarly to a consumer event listener, you can tell RedisSMQ to use a producer event listener by including it in the `eventListener.producerEventListeners` array from the configuration object as shown bellow:

```typescript
import { IConfig, Configuration } from 'redis-smq';

const config: IConfig = {
  eventListener: {
    producerEventListeners: [ProducerEventListener]
  }
}

Configuration.getSetConfig(config);
```

### Producer Message Events:

* events.MESSAGE_PUBLISHED