# Graceful Shutdown

RedisSMQ is designed to handle shutdowns without losing messages. Core operations are atomic, and proper shutdown ensures all in-flight messages are recovered.

## Recommended Shutdown Order

1. Stop your application from accepting new work
2. Shut down RedisSMQ — this handles all tracked components

## System Shutdown (Recommended)

If components were created via `RedisSMQ` factory methods, a single call shuts down everything:

```javascript
RedisSMQ.shutdown((err) => {
  if (err) console.error('Shutdown error:', err);
  else console.log('Clean exit');
  process.exit(err ? 1 : 0);
});
```

## Individual Shutdown

Shut down a specific component while keeping others running:

```javascript
// Stop a specific consumer
consumer.shutdown((err) => {
  if (err) console.error('Consumer shutdown failed:', err);
});

// Stop a specific producer
producer.shutdown((err) => {
  if (err) console.error('Producer shutdown failed:', err);
});
```

Components shut down individually are removed from tracking and will not be shut down again by `RedisSMQ.shutdown()`.

## Signal Handling

```javascript
function makeShutdownOnce() {
  let called = false;
  return () => {
    if (called) return;
    called = true;

    RedisSMQ.shutdown((err) => {
      if (err) console.error('Shutdown error:', err);
      process.exit(err ? 1 : 0);
    });
  };
}

const shutdown = makeShutdownOnce();
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

## What Happens During Shutdown

1. **Consumers stop** — in-flight messages are returned to the pending queue
2. **Producers stop** — pending publishes complete
3. **Background workers stop** — scheduled publishers, requeuers, reapers
4. **Event bus stops** — if enabled
5. **Redis connections close** — all connections are released

## In-Flight Messages

When a consumer shuts down:

- Messages currently being processed are unacknowledged
- They return to the pending queue for other consumers to process
- No messages are lost

## Crash Recovery

If a consumer crashes without a clean shutdown:

- Heartbeats stop
- A background reaper detects the dead consumer
- In-flight messages are recovered automatically

## Common Pitfalls

- **Don't force exit** — wait for the shutdown callback before calling `process.exit()`
- **Handle signals once** — ensure shutdown logic runs only once even if multiple signals arrive
- **Shutdown before closing Redis** — RedisSMQ needs Redis to clean up properly

## Related

- [Graceful Shutdown Concepts](https://github.com/weyoss/redis-smq-docs) — How shutdown works
- [Simplified API](simplified-redis-smq-api.md) — Factory methods and automatic cleanup
