[RedisSMQ](../README.md) / [Docs](README.md) / Queue Rate Limiting

# Queue Rate Limiting

Control how fast messages are consumed from a queue. Useful for protecting services, staying within API limits, or managing resource usage.

## Quick Start

### Set a Rate Limit

```javascript
const { RedisSMQ } = require('redis-smq');
const queueRateLimit = RedisSMQ.createQueueRateLimit();

// Limit: 100 messages per minute
queueRateLimit.set(
  'notifications',
  { limit: 100, interval: 60000 }, // 100 messages / 60 seconds
  (err) => {
    if (err) console.error('Failed:', err);
    else console.log('Rate limit set');
  },
);
```

### Check Current Limit

```javascript
queueRateLimit.get('notifications', (err, limit) => {
  if (err) console.error('Failed:', err);
  else console.log('Current limit:', limit);
  // Returns: { limit: 100, interval: 60000 } or null
});
```

### Remove Limit

```javascript
queueRateLimit.clear('notifications', (err) => {
  if (err) console.error('Failed:', err);
  else console.log('Limit removed');
});
```

## When to Use Rate Limiting

### 1. Protect External APIs

```javascript
// Don't exceed 10 requests/second to payment API
queueRateLimit.set(
  'payment-requests',
  { limit: 10, interval: 1000 }, // 10/sec
  callback,
);
```

### 2. Control Resource Usage

```javascript
// Limit image processing to 5/minute
queueRateLimit.set(
  'image-processing',
  { limit: 5, interval: 60000 }, // 5/min
  callback,
);
```

### 3. Smooth Traffic Spikes

```javascript
// Process max 1000 messages/hour
queueRateLimit.set(
  'data-sync',
  { limit: 1000, interval: 3600000 }, // 1000/hour
  callback,
);
```

## How It Works

- **Limit**: Maximum messages consumed in the interval
- **Interval**: Time window in milliseconds
- **Behavior**: Consumers wait when limit is reached

### Example: 50 messages per 30 seconds

```javascript
queueRateLimit.set(
  'my-queue',
  // Consumer processes max 50 messages every 30 seconds
  // Additional messages wait until next window
  { limit: 50, interval: 30000 },
  callback,
);
```

## Common Patterns

### Per-Second Limits

```javascript
queueRateLimit.set(
  'my-queue',
  // 20 messages per second
  { limit: 20, interval: 1000 },

  // 500 messages per second
  // { limit: 500, interval: 1000 },

  callback,
);
```

### Per-Minute Limits

```javascript
queueRateLimit.set(
  'my-queue',
  // 1000 messages per minute
  { limit: 1000, interval: 60000 },

  // 60 messages per minute (1/sec)
  // { limit: 60, interval: 60000 },

  callback,
);
```

### Hourly/Daily Limits

```javascript
queueRateLimit.set(
  'my-queue',
  // 10,000 messages per hour
  { limit: 10000, interval: 3600000 },

  // 100,000 messages per day
  // { limit: 100000, interval: 86400000 },

  callback,
);
```

## Advanced Usage

### Check If Limit Would Be Exceeded

```javascript
queueRateLimit.hasExceeded(
  'my-queue',
  { limit: 100, interval: 60000 },
  (err, exceeded) => {
    if (exceeded) {
      console.log('Would exceed limit - wait');
    } else {
      console.log('OK to proceed');
    }
  },
);
```

### Use With Namespaces

```javascript
// Different limits per environment
queueRateLimit.set(
  { ns: 'production', name: 'emails' },
  { limit: 1000, interval: 60000 },
  callback,
);

queueRateLimit.set(
  { ns: 'staging', name: 'emails' },
  { limit: 100, interval: 60000 },
  callback,
);
```

## Best Practices

### 1. Set Realistic Limits

```javascript
queueRateLimit.set(
  'my-queue',
  // ✅ Reasonable
  { limit: 50, interval: 1000 }, // 50/second

  // 3000/minute
  // { limit: 3000, interval: 60000 },

  // ❌ Too restrictive
  // { limit: 1, interval: 1000 }, // 1/second (very slow)

  callback,
);
```

### 2. Monitor Queue Backlog

```javascript
// Check if queue is backing up due to limits
const pending = RedisSMQ.createQueuePendingMessages();
pending.countMessages('my-queue', (err, count) => {
  if (count > 1000) {
    console.warn('Queue backing up - consider adjusting limit');
  }
});
```

### 3. Adjust Dynamically

```javascript
// Increase limit during off-peak
if (isOffPeakHours()) {
  queueRateLimit.set(
    'processing',
    { limit: 1000, interval: 60000 }, // Higher limit
    callback,
  );
} else {
  queueRateLimit.set(
    'processing',
    { limit: 100, interval: 60000 }, // Lower limit
    callback,
  );
}
```

### 4. Combine With Other Controls

```javascript
// Rate limit + message TTL
const msg = new ProducibleMessage()
  .setQueue('api-calls')
  .setTTL(30000) // Expire if not processed in 30s
  .setBody({ request: 'data' });

// Prevents stale messages from backing up
```

## Troubleshooting

### "Messages not being consumed"

1. Check rate limit settings
2. Verify limit isn't too restrictive
3. Monitor queue length
4. Test without limits to isolate issue

### "Limit not taking effect"

- Ensure rate limit is set before consumers start
- Check for namespace mismatches
- Verify Redis connection is working

### "Queue growing too fast"

```javascript
// Temporary increase
queueRateLimit.set(
  'fast-queue',
  { limit: 5000, interval: 60000 }, // Higher limit
  (err) => {
    if (!err) console.log('Limit increased temporarily');
  },
);
```

## Example: API Gateway Protection

```javascript
// Protect third-party API
queueRateLimit.set(
  'sendgrid-emails',
  { limit: 100, interval: 60000 }, // SendGrid limit: 100/minute
  (err) => {
    if (err) console.error('Failed to set limit:', err);
    else console.log('API protection active');
  },
);

// Consumer respects limit automatically
consumer.consume(
  'sendgrid-emails',
  (msg, done) => {
    sendEmail(msg.body).then(() => done());
  },
  callback,
);
```

---

**Related**:

- [QueueRateLimit API](api/classes/QueueRateLimit.md) - Complete method reference
- [Consuming Messages](consuming-messages.md) - How consumers work
- [Queues](queues.md) - Queue management
