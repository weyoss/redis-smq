# Consumer Groups

Manage consumer groups for Pub/Sub queues. Groups enable multiple services to each receive a copy of every message.

## Quick Start

```javascript
const { RedisSMQ } = require('redis-smq');
const consumerGroups = RedisSMQ.createConsumerGroups();
```

## Create a Consumer Group

```javascript
consumerGroups.saveConsumerGroup('notifications', 'email-service', (err) => {
  if (err) console.error('Failed:', err);
  else console.log('Group created');
});
```

Consumer groups are only supported on Pub/Sub queues. Point-to-Point queues do not use groups.

## Delete a Consumer Group

```javascript
consumerGroups.deleteConsumerGroup('notifications', 'email-service', (err) => {
  if (err) console.error('Failed:', err);
  else console.log('Group deleted');
});
```

The group must be empty (no pending messages) and have no active consumers.

## List Consumer Groups

```javascript
consumerGroups.getConsumerGroups('notifications', (err, groups) => {
  console.log('Groups:', groups);
  // ['email-service', 'sms-service', 'push-service']
});
```

## Using Groups with Consumers

```javascript
// Subscribe with a group ID
consumer.consume(
  { queue: 'notifications', groupId: 'email-service' },
  (message, done) => {
    console.log('Email service received:', message.body);
    done();
  },
  callback,
);
```

Each group receives a copy of every message. Within a group, messages are load-balanced across consumers.

## Ephemeral Groups

If a consumer subscribes without specifying a group ID on a Pub/Sub queue, an ephemeral group is created automatically. It is deleted when the consumer shuts down.

```javascript
// No groupId specified → ephemeral group created
consumer.consume('notifications', handler, callback);
```

## Promise Style

```javascript
await consumerGroups.saveConsumerGroup('notifications', 'email-service');
const groups = await consumerGroups.getConsumerGroups('notifications');
await consumerGroups.deleteConsumerGroup('notifications', 'email-service');
```

## Related

- [Consumer Groups Concepts](https://github.com/weyoss/redis-smq-docs) — How groups work
- [Queue Delivery Models](https://github.com/weyoss/redis-smq-docs) — Point-to-Point vs Pub/Sub
- [Consuming Messages](consuming-messages.md) — How to subscribe with groups
