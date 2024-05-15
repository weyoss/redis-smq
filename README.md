> [!IMPORTANT]
> Currently, RedisSMQ is going under heavy development. Pre-releases at any time may introduce new commits with breaking changes.
> The master branch always reflects the most recent changes. To view the latest release reference see [RedisSMQ v7.2.3](https://github.com/weyoss/redis-smq/tree/v7.2.3)

<div align="center" style="text-align: center">
    <p><a href="https://github.com/weyoss/redis-smq"><img alt="RedisSMQ" src="./logo.png?v=202312182134" /></a></p>
    <p>A simple high-performance Redis message queue for Node.js.</p>
    <p>
       <a href="https://github.com/weyoss/redis-smq/actions/workflows/tests.yml"><img src="https://github.com/weyoss/redis-smq/actions/workflows/tests.yml/badge.svg" alt="Tests" style="max-width:100%;" /></a>
       <a href="https://github.com/weyoss/redis-smq/actions/workflows/codeql.yml" rel="nofollow"><img src="https://github.com/weyoss/redis-smq/actions/workflows/codeql.yml/badge.svg" alt="Code quality" /></a>
       <a href="https://codecov.io/github/weyoss/redis-smq?branch=master" rel="nofollow"><img src="https://img.shields.io/codecov/c/github/weyoss/redis-smq" alt="Coverage Status" /></a>
       <a href="https://npmjs.org/package/redis-smq" rel="nofollow"><img src="https://img.shields.io/npm/v/redis-smq.svg" alt="NPM version" /></a>
       <a href="https://npmjs.org/package/redis-smq" rel="nofollow"><img src="https://img.shields.io/npm/dm/redis-smq.svg" alt="NPM downloads" /></a>
    </p>
</div>

# RedisSMQ

RedisSMQ is a Node.js library for queuing messages (aka jobs) and processing them asynchronously with consumers. Backed by Redis, it allows scaling up your typical applications with ease of use.

## Features

* [High-performance message processing](docs/performance.md).
* Flexible Producer/Consumer model which offers [Multi-Queue Producers](docs/producing-messages.md) & [Multi-Queue Consumers](docs/consuming-messages.md).
* RedisSMQ offers different exchange types: [Direct Exchange](docs/message-exchanges.md#direct-exchange), [Topic Exchange](docs/message-exchanges.md#topic-exchange), and [FanOut Exchange](docs/message-exchanges.md#fanout-exchange) for publishing a message to one or multiple queues.
* Supports [Point-2-Point](docs/queue-delivery-models.md#point-2-point-delivery-model) and [Pub/Sub](docs/queue-delivery-models.md#pubsub-delivery-model) [delivery models](docs/queue-delivery-models.md).
* Both [delivery models](docs/queue-delivery-models.md) are reliable. For cases of failure, while delivering/consuming messages, [at-least-once](docs/api/classes/ProducibleMessage.md#setretrythreshold) and [at-most-once](docs/api/classes/ProducibleMessage.md#setretrythreshold) modes may be configured.
* [3 queuing strategies](docs/queues.md): [FIFO queues](docs/queues.md#fifo-first-in-first-out-queues), [LIFO queues](docs/queues.md#lifo-last-in-first-out-queues), and [Priority Queues](docs/queues.md#priority-queues).
* [Message Handler Worker Threads](docs/message-handler-worker-threads.md) which allow sandboxing and running your message handler from a separate isolated thread and without affecting the performance of other message handlers from the same consumer.
* Messages can be [set to expire](docs/api/classes/ProducibleMessage.md#setttl) when not delivered within a given amount of time or to have a [consumption timeout](docs/api/classes/ProducibleMessage.md#setconsumetimeout) while being in process.
* Queues may be [rate Limited](docs/queue-rate-limiting.md) to control the rate at which the messages are consumed.
* Has a builtin [scheduler](docs/scheduling-messages.md) allowing messages [to be delayed](docs/api/classes/ProducibleMessage.md#setscheduleddelay), [to be delivered for N times](docs/api/classes/ProducibleMessage.md#setscheduledrepeat) with an optional [period between deliveries](docs/api/classes/ProducibleMessage.md#setscheduledrepeatperiod), or simply [to be scheduled using CRON expressions](docs/api/classes/ProducibleMessage.md#setscheduledcron).
* Provides [an HTTP interface](https://github.com/weyoss/redis-smq-rest-api) to interact with the message queue using a RESTful API.
* RedisSMQ can be managed also from your [web browser](https://github.com/weyoss/redis-smq-monitor-client).
* Either [node-redis](https://github.com/redis/node-redis) or [ioredis](https://github.com/luin/ioredis) can be used as a Redis client.
* [Highly optimized](https://lgtm.com/projects/g/weyoss/redis-smq/context:javascript), implemented using pure callbacks, with small memory footprint and no memory leaks. See [Callback vs Promise vs Async/Await benchmarks](https://gist.github.com/weyoss/24f9ecbda175d943a48cb7ec38bde821).
* [Both ESM & CJS modules are supported](docs/esm-cjs-modules.md).

## RedisSMQ Use Case: Multi-Queue Producers & Multi-Queue Consumers

![RedisSMQ Multi-Queue Producers & Multi-Queue Consumers](docs/redis-smq-multi-queue-consumers-producers.png)

## What's new?

:rocket: RC's are now available for RedisSMQ v8! The v8 release will bring major improvements and new features. Some of them are:

- [x] Message queue codebase refactoring and optimizations.
- [x] Message storage and handling improvements.
- [x] Message status which allows to retrieve, at any time, the status of a message by its ID.
- [x] [Pub/Sub Delivery Model and Consumer Groups](docs/queue-delivery-models.md#pubsub-delivery-model).
- [x] Message handlers sandboxing and message processing performance improvement with [Message Handler Worker Threads](docs/message-handler-worker-threads.md).
- [x] Cross-system event propagation based on [EventBus](docs/event-bus.md).
- [x] Better error handling aiming at reporting fatal errors to the application whenever it is possible and without crashing the main process.
- [x] [ESM Modules Support](docs/esm-cjs-modules.md).

Current RedisSMQ v8 RC status:

- [x] RedisSMQ Common Library
- [x] RedisSMQ
- [x] [RESTful API](https://github.com/weyoss/redis-smq-rest-api)
- [ ] Web UI (WIP)

If you wish to get the latest updates early feel free to try RedisSMQ v8 RC. Do not hesitate to report any bug or issue if encountered. 

Otherwise, stay with [RedisSMQ v7](https://github.com/weyoss/redis-smq/tree/v7.2.3) if you are looking for a fully working release with an HTTP API and a Web UI.

## Installation

```shell
npm i redis-smq@rc
```

Considerations:

- Minimal Node.js version is >= 18 (RedisSMQ is tested under current active LTS and maintenance LTS Node.js releases).
- Minimal Redis server version is 4.0.0.

## Usage

RedisSMQ provides 3 classes in order to work with the message queue: `ProducibleMessage`, `Producer`, and `Consumer`.

Producers and consumers exchange data using one or multiple queues that may be created using the [Queue Class](docs/api/classes/Queue.md).

A queue is responsible for holding messages which are produced by producers and are delivered to consumers.

### Creating a queue

```javascript
const queue = new Queue();
queue.save(
  'my_queue',
  EQueueType.LIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err) => {
    if (err) console.error(err);
  },
);
```

In the example above we are defining a [LIFO queue](docs/queues.md#lifo-last-in-first-out-queues) with a [POINT-2-POINT delivery model](docs/queue-delivery-models.md#point-2-point-delivery-model).

See [Queues](docs/queues.md) for more details.

### Producing a message

```javascript
const msg = new ProducibleMessage();
msg.setQueue('my_queue').setBody('Hello Word!');
producer.produce(msg, (err, ids) => {
  if (err) console.error(err);
  else console.log(`Produced message IDs are: ${ids.join(', ')}`);
});
```

See [Producing Messages](docs/producing-messages.md) for more details.

### Consuming a message

```javascript
const consumer = new Consumer();
const messageHandler = (msg, cb) => {
  console.log(msg.body);
  cb();
};
consumer.consume('my_queue', messageHandler, (err) => {
  if (err) console.error(err);
});
```

See [Consuming Messages](docs/consuming-messages.md) for more details.

## Documentation

See [RedisSMQ Docs](docs/README.md) for more details.

## Contributing

So you are interested in contributing to this project? Please see [CONTRIBUTING.md](https://github.com/weyoss/guidelines/blob/master/CONTRIBUTIONS.md).

## License

[MIT](https://github.com/weyoss/redis-smq/blob/master/LICENSE)
