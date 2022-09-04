## Message Exchanges

Starting with v7.1.0, message exchanges offer different ways to route a message to a queue.

A message exchange is like an address or a routing algorithm which decides to which queues the message should go.

Unlike other message queues, where messages are published first to an exchange, message exchanges in RedisSMQ does 
allow producers to directly publish messages to queues. 

Before publishing a message, an exchange for the message must be set. Out-of-box RedisSMQ offers 3 exchange types.

### Direct Exchange

The direct exchange allows producers to publish a message to a single queue which is matched exactly by the specified queue of the exchange.

The queue of the direct exchange may be a string, like `a.b.c.d`, which is composed of alphanumeric characters, including `-` and `_` characters, that may be separated by a `.`. 

Direct exchange queue may be also an object describing the namespace of the queue like `{ ns: 'my-app', name: 'a.b.c.d'}`. If a string is used for the direct exchange queue then the default namespace will be used.

A direct exchange with the queue `a.b.c.d` matches exactly the queue with the name `a.b.c.d`.

#### Usage

The [Message API](/docs/api/message.md) provides:

- [setQueue()](/docs/api/message.md#messageprototypesetqueue): to set up a queue for the message. Under the hood, a new `DirectExchange` instance will be created and used for the message exchange.
- [setExchange()](/docs/api/message.md#messageprototypesetexchange): to set a `DirectExchange` instance which you have manually created.

```typescript
import { Message, DirectExchange } from "redis-smq";

const msg = new Message();
msg.setQueue('a.b.c.d').setBody('123456789');

// the same as
const exchange = new DirectExchange('a.b.c.d');
msg.setExchange(exchange).setBody('123456789');
```

When publishing a message with a direct exchange, if the exchange queue does not exist the message will be discarded and an error will be returned.

### Topic Exchange

When the topic exchange is used for a message, it allows to publish the message to one or multiple queues which are matched by the topic pattern of the exchange.

The pattern of a topic exchange is a string which is composed of alphanumeric characters, including `-` and `_` characters, that are separated by a `.`.

The `a.b.c.d` topic pattern matches the following queues `a.b.c.d`, `a.b.c.d.e`, and `a.b.c.d.e.f`, but it does not match the `a.b`, `a.b.c`, or `a.b.c.z` queues.

Topic pattern may be also an object describing the namespace of the topic. 

For example the topic `{ ns: 'my-app', topic: 'a.b.c.d'}` will match all queues which satisfy the pattern `a.b.c.d` from the namespace `my-app`.

When a namespace is not provided the default namespace will be used.

#### Usage

The [Message API](/docs/api/message.md) provides:

- [setTopic()](/docs/api/message.md#messageprototypesettopic): to set up a topic for the message. Under the hood, a new `TopicExchange` instance will be created and used for the message exchange.
- [setExchange()](/docs/api/message.md#messageprototypesetexchange): to set a `TopicExchange` instance which you have manually created.

```typescript
import { Message, TopicExchange } from "redis-smq";

const msg = new Message();
msg.setTopic('a.b.c.d').setBody('123456789');

// the same as
const exchange = new TopicExchange('a.b.c.d');
msg.setExchange(exchange).setBody('123456789');
```

When publishing a message with a topic exchange, if the topic pattern does not match any queues the message will be discarded and an error will be returned.

### Fanout Exchange

The fanout exchange allows producers to publish a message to one or multiple queues which are bound to a binding key.

#### Usage

In order to use a fanout exchange you need first to create it and bind the selected queues to the exchange.

The [FanOutExchangeManager](/docs/api/fanout-exchange-manager.md) provides:

- [bindQueue()](/docs/api/fanout-exchange-manager.md#fanoutexchangemanagerprototypebindqueue): To bind an existing queue to a fanout exchange.
- [unbindQueue()](/docs/api/fanout-exchange-manager.md#fanoutexchangemanagerprototypeunbindqueue): To unbind a queue from a fanout exchange.
- [getQueueExchange()](/docs/api/fanout-exchange-manager.md#fanoutexchangemanagerprototypegetqueueexchange): To retrieve the fanout exchange to which a queue is bound.
- [getExchangeQueues()](/docs/api/fanout-exchange-manager.md#fanoutexchangemanagerprototypegetexchangequeues): To get the list of queues that are bound to a given fanout exchange. 

The [Message API](/docs/api/message.md) provides:

- [setFanout()](/docs/api/message.md#messageprototypesetfanout): to set up a fanout exchange for the message. Under the hood, a new `FanOutExchange` instance will be created and used for the message exchange.
- [setExchange()](/docs/api/message.md#messageprototypesetexchange): to set a `FanOutExchange` instance which you have manually created.

```typescript
import { Message, FanOutExchange } from "redis-smq";

// Assuming that my-fanout-exchange already exists

const msg = new Message();
msg.setFanOut('my-fanout-exchange').setBody('123456789');

// the same as
const exchange = new FanOutExchange('my-fanout-exchange');
msg.setExchange(exchange).setBody('123456789');
```

When publishing a message with a fanout exchange, if the exchange does not exist or no queues are bound to such an exchange the message will be discarded and error will be returned.

