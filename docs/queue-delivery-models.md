[RedisSMQ](../README.md) / [Docs](README.md) / Queue Delivery Models

# Queue Delivery Models

RedisSMQ offers two reliable message delivery models: **Point-to-Point** and **Pub/Sub**. Below, we delve into each 
model, providing detailed explanations, sample code snippets, and best practices for implementation.

## Point-to-Point Delivery Model

![Point-to-Point Delivery Model](redis-smq-point-2-point-delivery-model.png)

In the **Point-to-Point** model, a message is produced to a queue and delivered to a single consumer at a time. This 
model ensures that each message is processed only once by one consumer.

### Creating a Point-to-Point Queue

To create a Point-to-Point queue, use the following code snippet:

```javascript
const { Queue, EQueueDeliveryModel, EQueueType } = require('redis-smq');

const queue = new Queue();
queue.save(
  'my-queue',
  EQueueType.LIFO_QUEUE,
  EQueueDeliveryModel.POINT_TO_POINT,
  (err, reply) => {
    if (err) {
      console.error('Error creating queue:', err);
    } else {
      console.log('Successfully created queue:', reply);
    }
  }
);
```

*Refer to [Queue.save()](api/classes/Queue.md#save) for additional details.*

### Publishing a Message to a Point-to-Point Queue

To publish a message to a Point-to-Point queue, use the following:

```javascript
const { Producer, ProducibleMessage } = require('redis-smq');

const message = new ProducibleMessage();
message.setBody('hello world').setQueue('my-queue');

const producer = new Producer();
producer.run((err) => {
  if (err) {
    console.error('Error running producer:', err);
  } else {
    producer.produce(message, (err, reply) => {
      if (err) {
        console.error('Error producing message:', err);
      } else {
        console.log('Successfully produced message:', reply);
      }
    });
  }
});
```

*Refer to [Producer.produce()](api/classes/Producer.md#produce) for more details.*

### Consuming a Message from a Point-to-Point Queue

To consume a message from a Point-to-Point queue, you can use the following snippet:

```javascript
const { Consumer } = require('redis-smq');

const consumer = new Consumer();

const messageHandler = (msg, cb) => {
  // Acknowledge the message
  cb();
};

consumer.consume('my-queue', messageHandler, (err) => {
  if (err) {
    console.error('Error adding message handler:', err);
  } else {
    console.log('Message handler added successfully');
  }
});

consumer.run((err) => {
  if (err) {
    console.error('Error running consumer:', err);
  }
});
```

---

## Pub/Sub Delivery Model

### Overview

![Pub/Sub Delivery Model High-level View](redis-smq-pubsub-delivery-model-highlevel-view.png)

In the **Pub/Sub** model, messages are delivered to all consumers of a queue. Every consumer receives and processes a 
copy of the produced message.

### Consumer Groups

![Pub/Sub Delivery Model](redis-smq-pubsub-delivery-model.png)

To consume messages from a Pub/Sub queue, a consumer group is required.

- When publishing a message to a Pub/Sub queue, it is sent to all consumer groups associated with that queue.
- Within each consumer group, only one consumer will receive the message.
- If a message remains unacknowledged for a given time, it will be retried in the same manner as within a Point-to-Point queue.
- If the retry threshold is exceeded, failed messages can be stored, if configured, in the dead-letter queue for that Pub/Sub queue.

### Creating a Pub/Sub Queue

To create a Pub/Sub queue, use the following:

```javascript
const { Queue, EQueueDeliveryModel, EQueueType } = require('redis-smq');

const queue = new Queue();
queue.save(
  'my-pubsub-queue',
  EQueueType.LIFO_QUEUE,
  EQueueDeliveryModel.PUB_SUB,
  (err, reply) => {
    if (err) {
      console.error('Error creating Pub/Sub queue:', err);
    } else {
      console.log('Successfully created Pub/Sub queue:', reply);
    }
  }
);
```

*Refer to [Queue.save()](api/classes/Queue.md#save) for additional details.*

### Creating Consumer Groups

A consumer group is automatically created when consuming messages from the queue if it does not already exist.

You can also manually create consumer groups using the [ConsumerGroups.saveConsumerGroup()](api/classes/ConsumerGroups.md) method.

*Refer to the [ConsumerGroups Class](api/classes/ConsumerGroups.md) for managing consumer groups.*

### Publishing a Message to a Pub/Sub Queue

Use the following code to publish a message to a Pub/Sub queue:

```javascript
const { ProducibleMessage, Producer } = require('redis-smq');

const message = new ProducibleMessage();
message.setBody('hello world').setQueue('my-pubsub-queue');

const producer = new Producer();
producer.run((err) => {
  if (err) {
    console.error('Error running producer:', err);
  } else {
    producer.produce(message, (err, reply) => {
      if (err) {
        console.error('Error producing message:', err);
      } else {
        console.log('Successfully produced message:', reply);
      }
    });
  }
});
```

*Note:* When producing a message to a Pub/Sub queue, if no consumer groups exist, an error will be returned. Ensure 
that at least one consumer group is created prior to publishing messages.

*Refer to [Producer.produce()](api/classes/Producer.md#produce) for more details.*

### Consuming a Message from a Pub/Sub Queue

To consume a message from a Pub/Sub queue, ensure to specify the consumer group ID:

```javascript
const { Consumer } = require('redis-smq');

const consumer = new Consumer();

const messageHandler = (msg, cb) => {
  // Acknowledge the message
  cb();
};

consumer.consume(
  { queue: 'my-pubsub-queue', groupId: 'my-app-group-1' },
  messageHandler,
  (err) => {
    if (err) {
      console.error('Error adding message handler:', err);
    } else {
      console.log('Message handler added successfully');
    }
  }
);

consumer.run((err) => {
  if (err) {
    console.error('Error running consumer:', err);
  }
});
```

*Remember to provide the consumer group ID when consuming messages from a Pub/Sub queue.*
