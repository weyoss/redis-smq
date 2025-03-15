[RedisSMQ](../README.md) / [Docs](README.md) / Graceful Shutdown

# Graceful Shutdown

RedisSMQ is designed to handle failures and unexpected shutdowns without losing messages. It ensures that all
operations are transactional, guaranteeing data consistency and integrity.

To facilitate a smooth shutdown process and minimize the occurrence of failed messages, RedisSMQ provides a
shutdown() method in supported classes. This method performs critical cleanup tasks, including:

1. Completing in-progress message processing
2. Saving any necessary state information
3. Releasing system resources
4. Gracefully closing Redis connections

## Example of Shutting Down a Consumer:

```javascript
consumer.shutdown((err) => {
  if (err) {
    console.log('An error occurred');
    console.error(err);
  } else {
    console.log('Consumer has been shut down successfully');
  }
});
```

### Important Classes to Shut Down Before Exiting

Before terminating your application, be sure to call `shutdown()` on the following classes:

- [Consumer](api/classes/Consumer.md)
- [ConsumerGroups](api/classes/ConsumerGroups.md)
- [EventBus](api/classes/EventBus.md)
- [ExchangeDirect](api/classes/ExchangeDirect.md)
- [ExchangeFanOut](api/classes/ExchangeFanOut.md)
- [ExchangeTopic](api/classes/ExchangeTopic.md)
- [Message](api/classes/Message.md)
- [Namespace](api/classes/Namespace.md)
- [Producer](api/classes/Producer.md)
- [Queue](api/classes/Queue.md)
- [QueueAcknowledgedMessages](api/classes/QueueAcknowledgedMessages.md)
- [QueueDeadLetteredMessages](api/classes/QueueDeadLetteredMessages.md)
- [QueueMessages](api/classes/QueueMessages.md)
- [QueuePendingMessages](api/classes/QueuePendingMessages.md)
- [QueueRateLimit](api/classes/QueueRateLimit.md)
- [QueueScheduledMessages](api/classes/QueueScheduledMessages.md)

For a comprehensive list of classes that support graceful shutdown functionality, please refer to the
[API Documentation](api/README.md).
