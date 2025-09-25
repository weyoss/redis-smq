[RedisSMQ](../README.md) / [Docs](README.md) / Multiplexing

# Multiplexing

In standard operation mode, each message handler establishes and utilizes its own Redis connection for consuming
messages. This approach offers several significant advantages:

- **High Message Consumption Rate**: Independent connections can enhance the throughput of message handling.

- **Isolation of Message Handlers**: Each handler operates independently, preventing any single handler from blocking
  others and improving overall application responsiveness.

However, multiplexing allows multiple message handlers to share a single Redis connection, which, while it may seem
counterintuitive, presents some compelling benefits for your application.

## Advantages of Multiplexing

- **Resource Efficiency**: By sharing a single Redis connection, multiplexing enables consumers to manage a large
  number of message queues without imposing a considerable load on your system. This approach curtails the number of
  Redis connections, keeping it at just one for all message handlers regardless of the number of queues.

## Disadvantages of Multiplexing

However, multiplexing is not without its drawbacks:

- **Sequential Processing**: Messages from different queues cannot be dequeued and processed in parallel. Handlers are
  executed one after the other, leading to potential delays if multiplexing latency is applied before accessing the next
  queue.

- **Potential Delays in Message Processing**: If a message handler takes a considerable time to process a message, it
  can impede the timely dequeuing of messages for other handlers. This may not align with scenarios where prompt message
  consumption is critical.

## Considerations Before Enabling Multiplexing

Before opting for multiplexing, it’s crucial to weigh its advantages against the potential drawbacks. Assess your
specific use case to determine if the resource optimization justifies the limitations on processing speed and message
handling.
How to Enable Multiplexing

To enable multiplexing, you can utilize the first argument of
the [Consumer Class Constructor](api/classes/Consumer.md#constructor):

```javascript
const consumer = new Consumer(true);
```

Once your consumer instance is created, you can use it as follows:

```javascript
consumer.consume('queue1', messageHandler1, (e) => {
  //...
});

consumer.consume('queue2', messageHandler2, (e) => {
  //...
});

consumer.consume('queue3', messageHandler3, (e) => {
  //...
});

consumer.consume('queue4', messageHandler4, (e) => {
  //...
});
```

As highlighted, multiplexing should primarily be employed when managing a substantial number of queues and aiming to
optimize system resources. If this is not your situation, it may be advisable to refrain from enabling it.
