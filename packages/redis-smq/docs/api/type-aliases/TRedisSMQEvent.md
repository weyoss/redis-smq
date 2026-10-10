[RedisSMQ](../../../README.md) / [Documentation](../../README.md) / [API Reference](../README.md) / TRedisSMQEvent

# Type Alias: TRedisSMQEvent

> **TRedisSMQEvent** = [`TConfigurationEvent`](TConfigurationEvent.md) & [`TConsumerEvent`](TConsumerEvent.md) & [`TProducerEvent`](TProducerEvent.md) & [`TQueueEvent`](TQueueEvent.md)

The union of every event the library can emit on the public event bus.

Subscribers use this type to constrain their event name and payload:

eventBus.on('queue.queueCreated', (queue, properties) => {
// `queue` is IQueueParams
// `properties` is IQueueProperties
});

The intersection of the four category maps means a subscription is
valid for any event in any category. The compiler enforces that the
listener's parameters match the event's payload shape.

The type is used throughout the event bus, the multiplexer's routing
table, and every `eventPublisher` module that forwards a component's
local events to the public bus.
