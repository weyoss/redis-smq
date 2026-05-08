# Queue Rate Limiting

Control how fast messages are consumed from a queue. Useful for protecting downstream services, staying within API limits, or managing resource usage.

## Quick Start

```javascript
const { RedisSMQ } = require('redis-smq');
const queueRateLimit = RedisSMQ.createQueueRateLimit();

// Set a limit: 100 messages per minute
queueRateLimit.set('notifications', { limit: 100, interval: 60000 }, (err) => {
  if (err) console.error('Failed:', err);
  else console.log('Rate limit set');
});
```

## Managing Rate Limits

### Set a Limit

```javascript
queueRateLimit.set(
  'orders',
  { limit: 50, interval: 30000 }, // 50 messages per 30 seconds
  callback,
);
```

### Get Current Limit

```javascript
queueRateLimit.get('orders', (err, limit) => {
  if (err) console.error('Failed:', err);
  else if (limit)
    console.log('Limit:', limit.limit, 'per', limit.interval, 'ms');
  else console.log('No rate limit set');
});
```

### Check if Limit Would Be Exceeded

```javascript
queueRateLimit.hasExceeded(
  'orders',
  { limit: 100, interval: 60000 },
  (err, exceeded) => {
    if (exceeded) console.log('Would exceed limit');
    else console.log('OK to proceed');
  },
);
```

### Clear a Limit

```javascript
queueRateLimit.clear('orders', (err) => {
  if (err) console.error('Failed:', err);
  else console.log('Rate limit removed');
});
```

## Using with Namespaces

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

## Promise Style

```javascript
await queueRateLimit.set('orders', { limit: 100, interval: 60000 });
const limit = await queueRateLimit.get('orders');
const exceeded = await queueRateLimit.hasExceeded('orders', {
  limit: 100,
  interval: 60000,
});
await queueRateLimit.clear('orders');
```

## Common Patterns

### Protect External APIs

```javascript
// Don't exceed 10 requests/second to payment API
queueRateLimit.set('payment-requests', { limit: 10, interval: 1000 }, callback);
```

### Per-Second, Per-Minute, Per-Hour Limits

```javascript
// Per second
queueRateLimit.set('api-calls', { limit: 20, interval: 1000 }, callback);

// Per minute
queueRateLimit.set('emails', { limit: 1000, interval: 60000 }, callback);

// Per hour
queueRateLimit.set('reports', { limit: 10000, interval: 3600000 }, callback);
```

### Dynamic Adjustment

```javascript
// Increase limit during off-peak
if (isOffPeakHours()) {
  queueRateLimit.set('processing', { limit: 1000, interval: 60000 }, callback);
} else {
  queueRateLimit.set('processing', { limit: 100, interval: 60000 }, callback);
}
```

## Best Practices

- **Set realistic limits** — too restrictive limits cause queue backup
- **Monitor queue depth** — check pending message counts to see if limits are too tight
- **Adjust dynamically** — change limits based on time of day or system load
- **Combine with TTL** — set message TTL so stale messages expire rather than accumulating
- **Validate before setting** — use `QueueOperationValidator.canSetRateLimit()` to check if the queue allows it

## Related

- [Queue Rate Limiting Concepts](https://github.com/weyoss/redis-smq-docs) — How rate limiting works
- [Validating Queue Operations](validating-queue-operations.md) — Check if operations are allowed
- [Configuration](configuration.md) — System settings
