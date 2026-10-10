[RedisSMQ](../README.md) / [Documentation](README.md) / Queue Rate Limiting

# Queue Rate Limiting

Control how fast messages are **consumed** from a queue. Useful for protecting downstream services, staying within API limits, or managing resource usage.

Rate limiting applies only to the consumption path. Publishing into a rate-limited queue is not bounded — messages accumulate in the pending list until the rate limit permits their dequeue.

## Quick Start

```javascript
const { RedisSMQ } = require('redis-smq');
const queueRateLimit = RedisSMQ.createQueueRateLimitManager();

// 100 messages per minute
await queueRateLimit.set('notifications', { limit: 100, interval: 60000 });
console.log('Rate limit set');
```

The limit is enforced by an atomic Redis check that runs before every dequeue attempt. If the limit is reached, the dequeue attempt is a no-op and the message stays in the pending list. Because the check is atomic and shared, the limit holds across every consumer subscribed to the queue, not per consumer.

## Managing Rate Limits

### Set a Limit

```javascript
await queueRateLimit.set(
  'orders',
  { limit: 50, interval: 30000 }, // 50 messages per 30 seconds
);
```

Validation:

- `limit` must be a positive integer; a non-positive value rejects with `InvalidRateLimitValueError`.
- `interval` must be at least 1000 milliseconds; a smaller value rejects with `InvalidRateLimitIntervalError`. The minimum exists because the counter's resolution is one millisecond — a shorter window would be dominated by network latency rather than reflecting real rate behavior.

Calling `set` on a queue that already has a rate limit **replaces** the existing limit. The rate-limit counter is not reset — an in-progress window continues with the new limit applied to subsequent decrements.

Fails with `QueueNotFoundError` if the queue does not exist. Fails with `QueueLockedError` if the queue is LOCKED.

### Get Current Limit

```javascript
const limit = await queueRateLimit.get('orders');
if (limit) {
  console.log(`Limit: ${limit.limit} per ${limit.interval}ms`);
} else {
  console.log('No rate limit set');
}
```

Returns `null` for a queue with no rate limit set, or whose limit has been cleared. Fails with `QueueNotFoundError` if the queue does not exist.

### Check if Limit Has Been Reached

```javascript
const exceeded = await queueRateLimit.hasExceeded('orders', {
  limit: 100,
  interval: 60000,
});
if (exceeded) {
  console.log('Rate limit reached, backing off');
} else {
  console.log('Under the limit');
}
```

`hasExceeded` tests the given `rateLimit` value against the queue's **live counter**. It does not read the stored limit — callers typically pass the same value they stored via `set`, but a hypothetical value can also be probed.

The check is a **read-only observation**: it does not consume a slot from the rate-limit window. Only the dequeue path decrements the counter, so polling `hasExceeded` has no effect on the actual rate.

Fails with `QueueNotFoundError` if the queue does not exist.

### Clear a Limit

```javascript
await queueRateLimit.clear('orders');
console.log('Rate limit removed');
```

After clearing, the queue's dequeue path is unbounded. The rate-limit counter is deleted; a subsequent `set` starts a fresh window.

The call is **idempotent** — a queue with no rate limit is unaffected, and no error is raised. This makes clearing safe for cleanup scripts that cannot know in advance whether a queue was rate-limited.

Fails with `QueueNotFoundError` if the queue does not exist. Fails with `QueueLockedError` if the queue is LOCKED.

## Using with Namespaces

Queue namespaces isolate rate limits the same way they isolate queues:

```javascript
// Different limits per environment
await queueRateLimit.set(
  { ns: 'production', name: 'emails' },
  { limit: 1000, interval: 60000 },
);

await queueRateLimit.set(
  { ns: 'staging', name: 'emails' },
  { limit: 100, interval: 60000 },
);
```

See [Namespaces](namespaces.md) for the default-namespace fallback rules.

## Promise Style

Every method supports both callback and promise forms.

```javascript
await queueRateLimit.set('orders', { limit: 100, interval: 60000 });
const limit = await queueRateLimit.get('orders');
const exceeded = await queueRateLimit.hasExceeded('orders', {
  limit: 100,
  interval: 60000,
});
await queueRateLimit.clear('orders');
```

The callback form passes an `(err, result)` callback as the last argument:

```javascript
queueRateLimit.set('orders', { limit: 100, interval: 60000 }, (err) => {
  if (err) console.error('Failed:', err);
  else console.log('Rate limit set');
});
```

## Common Patterns

### Protect External APIs

```javascript
// Don't exceed 10 requests/second to payment API
await queueRateLimit.set('payment-requests', { limit: 10, interval: 1000 });
```

### Per-Second, Per-Minute, Per-Hour Limits

```javascript
// Per second
await queueRateLimit.set('api-calls', { limit: 20, interval: 1000 });

// Per minute
await queueRateLimit.set('emails', { limit: 1000, interval: 60000 });

// Per hour
await queueRateLimit.set('reports', { limit: 10000, interval: 3600000 });
```

### Dynamic Adjustment

```javascript
// Increase limit during off-peak
const limit = isOffPeakHours() ? 1000 : 100;
await queueRateLimit.set('processing', { limit, interval: 60000 });
```

## Checking Before You Set

`QueueOperationValidator.canSetRateLimit(queue)` and `canClearRateLimit(queue)` return whether the operation is currently permitted — useful when the queue's state may have changed since you last checked:

```javascript
const { QueueOperationValidator } = require('redis-smq');

const canSet = await QueueOperationValidator.canSetRateLimit('orders');
if (canSet) {
  await queueRateLimit.set('orders', { limit: 100, interval: 60000 });
}
```

See [Validating Queue Operations](validating-queue-operations.md) for the full set of validators.

## Best Practices

- **Set realistic limits** — too restrictive and the queue backs up; too permissive and the limit provides no protection
- **Monitor queue depth** — a growing pending count is the signal that the limit is too tight for the incoming rate
- **Adjust dynamically** — change limits based on time of day or downstream health
- **Combine with TTL** — set a message TTL so that stale messages expire rather than accumulate during a long rate-limited window
- **Validate before setting** — use `QueueOperationValidator.canSetRateLimit()` when the queue's state may not be `ACTIVE`

## Related

- [Queue Rate Limiting Concepts](https://github.com/weyoss/redis-smq-docs) — How rate limiting works
- [Validating Queue Operations](validating-queue-operations.md) — Check if operations are allowed
- [Configuration](configuration.md) — System settings
- [Queue Management](queue-management.md) — Queue lifecycle
