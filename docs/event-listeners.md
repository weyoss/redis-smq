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
import { IEventListener, IEventProvider } from 'redis-smq/dist/types';
import { events } from 'redis-smq';

export class ConsumerEventListener implements IEventListener {
  constructor(
    redisClient: RedisClient,
    consumerId: string,
    queue: TQueueParams,
    eventProvider: IEventProvider,
  ) {
    eventProvider.on(events.MESSAGE_ACKNOWLEDGED, (msg: Message) => {
      // ...
    });
    eventProvider.on(events.MESSAGE_DEAD_LETTERED, (msg: Message) => {
      // ...
    });
  }

  quit(cb: ICallback<void>) {
    cb();
  }
}
```

A consumer event listener is a class with the following constructor signature:

```javascript
constructor(redisClient, consumerId, queue, eventProvider)
```

Each time you create a consumer instance, under the hood, RedisSMQ initializes the provided event listeners and manages 
them until the instance is destroyed. 

RedisSMQ instantiates consumer event listener classes with the following arguments:

- `redisClient`: A RedisClient instance. 
- `consumerId`: Consumer ID.
- `queue`: Queue parameters (queue name and namespace).
- `eventProvider`: An EventProvider instance which allows listening to events from the consumer (`consumerId`) and specific to the queue (`queue`). 

A consumer event listener class has also to implement the `IEventListener` interface:

```typescript
interface IEventListener {
  quit(cb: ICallback<void>): void;
}
```

In fact, the `quit()` method is required to gracefully shut down event listener instances when a `message handler` or a consumer instance goes down.

Using a configuration object, RedisSMQ allows you to register one or many event listener classes as shown in the example bellow:

```typescript
import { IConfig } from 'redis-smq/dist/types';
import { Consumer } from 'redis-smq';

const config: IConfig = {
  eventListener: {
    consumerEventListeners: [ConsumerEventListener]
  }
}

const consumer = new Consumer(config);
```

### Consumer Message Events:

* events.MESSAGE_RECEIVED
* events.MESSAGE_ACKNOWLEDGED
* events.MESSAGE_UNACKNOWLEDGED
* events.MESSAGE_DEAD_LETTERED

## Producer Event Listeners

The producer event listener class constructor has the following signature: 

```javascript
constructor(redisClient, producerId, eventProvider)
```

- `redisClient`: A RedisClient instance.
- `producerId`: Producer ID.
- `eventProvider`: An EventProvider instance which allows you to listen to emitted events from the producer (`producerId`). 

Example:

```typescript
import { IEventListener, IEventProvider } from 'redis-smq/dist/types';
import { events } from 'redis-smq';

export class ProducerEventListener implements IEventListener {
  constructor(
    redisClient: RedisClient,
    producerId: string,
    eventProvider: IEventProvider,
  ) {
    eventProvider.on(events.MESSAGE_PUBLISHED, (msg: Message) => {
      // ...
    });
  }

  quit(cb: ICallback<void>) {
    cb();
  }
}
```

Similarly to a consumer event listener, you can tell RedisSMQ to use a producer event listener by including it in 
the `eventListener.producerEventListeners` array from the configuration object as shown bellow:

```typescript
import { IConfig } from 'redis-smq/dist/types';
import { Producer } from 'redis-smq';

const config: IConfig = {
  eventListener: {
    producerEventListeners: [ProducerEventListener]
  }
}

const producer = new Producer(config);
```

### Producer Message Events:

* events.MESSAGE_PUBLISHED