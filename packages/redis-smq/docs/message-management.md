[RedisSMQ](../README.md) / [Documentation](README.md) / Message Management

# Message Management

Retrieve, delete, and requeue individual messages by ID.

## Quick Start

```javascript
const { RedisSMQ } = require('redis-smq');
const messageManager = RedisSMQ.createMessageManager();
```

## Retrieve Messages

### Get a Single Message

```javascript
messageManager.getMessageById('msg-123', (err, message) => {
  if (err) console.error('Failed:', err);
  else console.log('Message:', message.body);
});
```

### Get Multiple Messages

```javascript
messageManager.getMessagesByIds(
  ['msg-1', 'msg-2', 'msg-3'],
  (err, messages) => {
    if (err) console.error('Failed:', err);
    else {
      messages.forEach((msg) => {
        console.log(`${msg.id}: ${msg.status}`);
      });
    }
  },
);
```

## Delete Messages

### Delete a Single Message

```javascript
messageManager.deleteMessageById('msg-123', (err) => {
  if (err) console.error('Failed:', err);
  else console.log('Deleted');
});
```

### Delete Multiple Messages

```javascript
messageManager.deleteMessagesByIds(['msg-1', 'msg-2'], (err) => {
  if (err) console.error('Failed:', err);
  else console.log('Deleted');
});
```

## Requeue Messages

Requeue creates a copy of an acknowledged or dead-lettered message for reprocessing:

```javascript
messageManager.requeueMessageById('msg-123', (err, newId) => {
  if (err) console.error('Failed:', err);
  else console.log(`Requeued as: ${newId}`);
});
```

Only acknowledged and dead-lettered messages can be requeued. The original message is unchanged — a new copy is created with a new ID.

## Check Message Status

```javascript
messageManager.getMessageStatus('msg-123', (err, status) => {
  if (err) console.error('Failed:', err);
  else console.log('Status:', status);
});
```

## Unacknowledgment History

View the failure timeline for a message (requires `unacknowledgementHistory` audit enabled):

```javascript
messageManager.getMessageUnacknowledgementHistory('msg-123', (err, history) => {
  if (err) console.error('Failed:', err);
  else {
    history.forEach((record) => {
      console.log(`${new Date(record.timestamp)}: ${record.cause}`);
    });
  }
});
```

## Promise Style

```javascript
const message = await messageManager.getMessageById('msg-123');
const messages = await messageManager.getMessagesByIds(['msg-1', 'msg-2']);
await messageManager.deleteMessageById('msg-123');
const newId = await messageManager.requeueMessageById('msg-123');
```

## Related

- [Messages Concepts](https://github.com/weyoss/redis-smq-docs) — Message lifecycle
- [Message Audit](message-audit.md) — Browsing tracked messages
- [Scheduling Messages](scheduling-messages.md) — Managing scheduled messages
