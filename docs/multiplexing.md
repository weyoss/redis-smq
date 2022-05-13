# Multiplexing

In normal operation mode, each message handler creates and uses its own redis connection for consuming messages. This gives your application many advantages, some of them are:

- High message consumption rate
- Message handlers run independently and do not block each other

On the other hand, multiplexing allows many message handlers to share a single Redis connection. While this may sound counterproductive, it gives your applications some obvious advantages.

One of them is that consumers using multiplexing can handle a large number of message queues without creating a significant load on your system. The number of Redis connections does not grow linearly as the number of queues grows, and it is reduced to only one shared connection for all your message handlers. 

Multiplexing does not come without a cost. Here are some of its disadvantages:

- Messages, from multiple queues, can not be dequeued and consumed in parallel. In fact, message handlers are run sequentially one after another, and sometimes a multiplexing delay is applied before dequeuing a message from the next queue.
- A message handler may take a long time to consume a message and thus not giving back control to other message handlers for dequeuing messages. This may not be desirable if you are expecting messages to be consumed as soon as they are published.

So, before deciding whether to use multiplexing, it is important to know what you are dealing with, considering all the advantages and the disadvantages that it implies.

## Enabling multiplexing

Before creating a consumer instance, the [Consumer class constructor](/docs/api/consumer.md#consumerprototypeconstructor) accepts a boolean as its first argument for enabling multiplexing:

```javascript
const consumer = new Consumer(true);
```

Once created, you can use your consumer instance as usually:

```javascript
consumer.consume('queue1', (e) => { 
  //... 
});

consumer.consume('queue2', (e) => {
  //... 
});

consumer.consume('queue3', (e) => {
  //... 
});

consumer.consume('queue4', (e) => {
  //... 
});
```

As noted above, you should use multiplexing only when you really have a large number of queues, and you want to optimize your system resources. Otherwise, you should not enable it.


