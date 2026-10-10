[RedisSMQ](../README.md) / [Documentation](README.md) / Consumer Groups

# Consumer Groups

Manage consumer groups for Pub/Sub queues. Groups enable multiple services to each receive a copy of every message.

## Quick Start

```javascript
const { RedisSMQ } = require('redis-smq');
const consumerGroups = RedisSMQ.createConsumerGroupsManager();
```

## Create a Consumer Group

```javascript
consumerGroups.saveConsumerGroup(
  'notifications',
  'email-service',
  (err, result) => {
    if (err) console.error('Failed:', err);
    else if (result === 1) console.log('Group created');
    else console.log('Group already existed');
  },
);
```

`saveConsumerGroup` returns `1` when the group is newly created and `0` when it already existed. Creating a group that is already present is not an error — the two outcomes are distinguished by the return value, matching Redis's `SADD` semantics.

Consumer groups are only supported on Pub/Sub queues. Calling `saveConsumerGroup` or `deleteConsumerGroup` against a Point-to-Point queue rejects with `ConsumerGroupsNotSupportedError`.

## Delete a Consumer Group

```javascript
consumerGroups.deleteConsumerGroup('notifications', 'email-service', (err) => {
  if (err) console.error('Failed:', err);
  else console.log('Group deleted');
});
```

Two preconditions must hold before deletion is allowed:

- The group must have no active consumers, or the call rejects with `ConsumerGroupHasActiveConsumersError`.
- The group's pending queue must be empty, or the call rejects with `ConsumerGroupNotEmptyError`.

These preconditions exist because deleting a group that is still in use would silently orphan either the consumers (still listening on a queue that no longer routes to them) or the messages (lost when the pending list is deleted).

## List Consumer Groups

```javascript
consumerGroups.getConsumerGroups('notifications', (err, groups) => {
  console.log('Groups:', groups);
  // ['email-service', 'sms-service', 'push-service']
});
```

For a Point-to-Point queue, `getConsumerGroups` resolves with an empty array rather than rejecting. This asymmetry with `saveConsumerGroup` and `deleteConsumerGroup` — which both reject non-Pub/Sub queues — is deliberate: a Point-to-Point queue has no group registry, so "the set of groups on it" is empty.

For a Pub/Sub queue, the result also includes any ephemeral group IDs (see below), which are prefixed with `cid-` so they can be distinguished from caller-chosen group IDs.

## Using Groups with Consumers

```javascript
const consumer = RedisSMQ.createConsumer();
await consumer.run();

// Subscribe with a group ID
await consumer.consume(
  {
    queueParams: { name: 'notifications', ns: 'default' },
    groupId: 'email-service',
  },
  (message, done) => {
    console.log('Email service received:', message.body);
    done();
  },
);
```

The queue argument to `consume` accepts one of three shapes:

| Shape                               | Example                                       |
| ----------------------------------- | --------------------------------------------- |
| Queue name (uses default namespace) | `'notifications'`                             |
| Queue params                        | `{ name: 'notifications', ns: 'production' }` |
| Parsed params with consumer group   | `{ queueParams: { name, ns }, groupId }`      |

Only the third form carries a group ID. A bare `{ queue, groupId }` object is **not** a valid queue argument — the group ID must be nested inside `queueParams`.

Each group receives a copy of every message. Within a group, messages are load-balanced across consumers.

## Ephemeral Groups

If a consumer subscribes without specifying a group ID on a Pub/Sub queue, an ephemeral group is created automatically for that consumer. It is deleted when the consumer shuts down.

```javascript
// No groupId specified → ephemeral group created with ID 'cid-<consumerId>'
await consumer.consume('notifications', handler);
```

Ephemeral group IDs are always prefixed with `cid-` followed by the consumer's own ID. They are managed entirely by the library — a caller should not create or delete them directly.

## Promise Style

Every method supports both callback and promise forms.

```javascript
const created = await consumerGroups.saveConsumerGroup(
  'notifications',
  'email-service',
);
const groups = await consumerGroups.getConsumerGroups('notifications');
await consumerGroups.deleteConsumerGroup('notifications', 'email-service');
```

## Related

- [Consumer Groups Concepts](https://github.com/weyoss/redis-smq-docs) — How groups work
- [Queue Delivery Models](https://github.com/weyoss/redis-smq-docs) — Point-to-Point vs Pub/Sub
- [Consuming Messages](consuming-messages.md) — How to subscribe with groups
