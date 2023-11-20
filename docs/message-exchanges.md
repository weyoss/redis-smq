>[RedisSMQ](../README.md) / [Docs](README.md) / Message Exchanges

# Message Exchanges

Starting with v7.1.0, message exchanges offer different ways to route a message to one or multiple queues.

A message exchange is like an address or a routing algorithm which decides to which queues the message should go.

Unlike other message queues, where messages are published first to an exchange, message exchanges in RedisSMQ do not store messages.

Each message is required to have a `message exchange` which is used by the producer to retrieve the list of queues that matches the exchange parameters.

From then, the producer **directly** publishes the message to the matched queues.

When a message is published to multiple queues, for each queue a new message is created with the same properties as the base message but with a new ID. 

For a given message exchange, all messages that were created and published to multiple queues have the same `exchange tag`.

An `exchange tag` is a unique string property that identifies an exchange instance and, it is used to keep track of published messages originating from the same exchange instance.

Out-of-box RedisSMQ offers 3 exchange types.

## Direct Exchange

A direct exchange allows producers to publish a message to a single queue which is matched exactly by the specified queue of the exchange.

The queue of the direct exchange may be a string, like `a.b.c.d` or an object describing the namespace of the queue like `{ ns: 'my-app', name: 'a.b.c.d'}`. 

If a string is used for the direct exchange queue then the **default** namespace will be used.

A direct exchange with the queue `a.b.c.d` matches exactly the queue with the name `a.b.c.d`.

### Usage

The [Message Class](api/classes/Message.md) provides:

- [setQueue()](api/classes/Message.md#setqueue): to set up a queue for the message. Under the hood, a new `ExchangeDirect` instance will be created and used for the message exchange.
- [setExchange()](api/classes/Message.md#setexchange): to set a `ExchangeDirect` instance which you have manually created.

```typescript
import { Message, ExchangeDirect } from "redis-smq";

const msg = new Message();
msg.setQueue('a.b.c.d').setBody('123456789');

// the same as
const exchange = new ExchangeDirect('a.b.c.d');
msg.setExchange(exchange).setBody('123456789');
```

When publishing a message with a direct exchange, if the exchange queue does not exist the message will be discarded and an error will be returned.

## Topic Exchange

When a topic exchange is used for a message, it allows to publish the message to one or multiple queues which are matched by the topic pattern of the exchange.

The pattern of a topic exchange is a string which is composed of alphanumeric characters, including `-` and `_` characters, that are separated by a `.`.

The `a.b.c.d` topic pattern matches the following queues `a.b.c.d`, `a.b.c.d.e`, and `a.b.c.d.e.f`, but it does not match the `a.b`, `a.b.c`, or `a.b.c.z` queues.

A topic pattern may be also an object describing the namespace of the topic. 

For example the topic `{ ns: 'my-app', topic: 'a.b.c.d'}` will match all queues which satisfy the pattern `a.b.c.d` from the namespace `my-app`.

When a namespace is not provided the default namespace will be used.

### Usage

The [Message Class](api/classes/Message.md) provides:

- [setTopic()](api/classes/Message.md#settopic): to set up a topic for the message. Under the hood, a new `ExchangeTopic` instance will be created and used for the message exchange.
- [setExchange()](api/classes/Message.md#setexchange): to set a `ExchangeTopic` instance which you have manually created.

```typescript
import { Message, ExchangeTopic } from "redis-smq";

const msg = new Message();
msg.setTopic('a.b.c.d').setBody('123456789');

// the same as
const exchange = new ExchangeTopic('a.b.c.d');
msg.setExchange(exchange).setBody('123456789');
```

When publishing a message with a topic exchange, if the topic pattern does not match any queues the message will be discarded and an error will be returned.

## FanOut Exchange

A FanOut exchange allows producers to publish a message to one or multiple queues which are bound to this exchange by a binding key.

### Usage

In order to use a FanOut exchange you need first to create it and bind the selected queues to the exchange.

The [FanOutExchange](api/classes/ExchangeFanOut.md) provides:

- [bindQueue()](api/classes/ExchangeFanOut.md#bindqueue): To bind an existing queue to a FanOut exchange.
- [unbindQueue()](api/classes/ExchangeFanOut.md#unbindqueue): To unbind a queue from a FanOut exchange.
- [getQueueExchange()](api/classes/ExchangeFanOut.md#getqueueexchange): To retrieve the FanOut exchange to which a queue is bound.
- [getQueues()](api/classes/ExchangeFanOut.md#getqueues): To get the list of queues that are bound to a given FanOut exchange. 

The [Message API](api/classes/Message.md) provides:

- [setFanOut()](api/classes/Message.md#setfanout): to set up a FanOut exchange for the message. Under the hood, a new `ExchangeFanOut` instance will be created and used for the message exchange.
- [setExchange()](api/classes/Message.md#setexchange): to set a `ExchangeFanOut` instance which you have manually created.

```typescript
import { Message, ExchangeFanOut } from "redis-smq";

// Assuming that my-FanOut-exchange already exists

const msg = new Message();
msg.setFanOut('my-FanOut-exchange').setBody('123456789');

// the same as
const exchange = new ExchangeFanOut('my-FanOut-exchange');
msg.setExchange(exchange).setBody('123456789');
```

When publishing a message with a FanOut exchange, if the exchange does not exist or no queues are bound to such an exchange the message will be discarded and error will be returned.

Additionally, FanOut exchanges can be also managed using the [HTTP API Interface](https://github.com/weyoss/redis-smq-monitor) or from your browser with the help of the [Web UI](https://github.com/weyoss/redis-smq-monitor-client).
