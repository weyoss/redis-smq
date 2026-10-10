[RedisSMQ](../README.md) / [Documentation](README.md) / Graceful Shutdown

# Graceful Shutdown

RedisSMQ is designed to handle shutdowns without losing messages. Core operations are atomic, and proper shutdown ensures in-flight work is either completed, requeued, or dead-lettered according to the message's retry policy.

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

`RedisSMQ.shutdown()` is **idempotent**:

- A call while the library is already down resolves immediately.
- A call while a shutdown is in flight queues the caller; the callback fires once the in-flight shutdown completes.
- A call while initialization is in flight fails with `PanicError`. Wait for `initialize()` to settle before calling shutdown.

`RedisSMQ.shutdown()` stops the background-worker cluster, tears down every component produced by the `create*` factory methods, stops the configuration sync, stops both event buses, and closes the connection pool. Redis itself is untouched — the library closes its own connections, not the server.

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

`shutdown()` on a component is idempotent — a second call is a no-op. The component remains registered with `RedisSMQ`'s component registry, so a later `RedisSMQ.shutdown()` will call `shutdown()` on it again; that second call is what the idempotency above absorbs.

## Signal Handling

A common pattern for CLI applications and servers:

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

The `called` guard matters even though `RedisSMQ.shutdown()` is itself idempotent: it prevents a second signal from scheduling a second `process.exit()` before the first shutdown completes.

## What Happens During Shutdown

In order:

1. **Background workers stop** — the scheduled-message publisher, the delayed and immediate requeuers, the consumer reaper, and the orphaned-lock recovery worker.
2. **Tracked components stop** — every consumer, producer, and manager created via `RedisSMQ.create*()` factory methods.
3. **Configuration sync stops** — the mechanism that propagates config changes across processes.
4. **Event buses stop** — the public bus (if it was started) and the internal bus.
5. **Connection pool closes** — every pooled Redis connection is halted and released.

A failure in one step does not prevent the remaining steps from running. All accumulated errors are reported through the shutdown callback's first argument.

## In-Flight Messages

When a consumer shuts down, its `MessageUnacknowledger` runs as part of the consumer's `goingDown` sequence and unacknowledges every message still in the consumer's processing queue, with cause `SHUTTING_DOWN`. The unacknowledgement pipeline then resolves each message according to its retry policy:

- **Requeue** — the message returns to the pending queue for another consumer to pick up.
- **Delay** — the message moves to the delayed set for a scheduled retry.
- **Dead-letter** — the message moves to the dead-letter list, either because its retry threshold was already exhausted or because it is a periodic message.

The first two cases mean the message is retried; the third means the message is preserved for inspection but not retried. If your application needs "every in-flight message must be retried" semantics, configure the message's `retryThreshold` and `retryDelay` accordingly before shutdown.

## Crash Recovery

If a consumer crashes without a clean shutdown:

- Its heartbeat key expires after `heartbeatTTL` milliseconds (default 60 seconds).
- Another consumer's `ReapConsumersWorker` detects the expired heartbeat.
- The reaper unacknowledges the dead consumer's in-flight messages with cause `OFFLINE_CONSUMER`, applies the same requeue/delay/dead-letter resolution described above, and unregisters the dead consumer.

Because the reaper runs continuously, a crash does not require operator intervention to recover the messages.

## Common Pitfalls

- **Don't force exit** — wait for the shutdown callback before calling `process.exit()`. Calling `process.exit()` immediately after `RedisSMQ.shutdown()` (without waiting for the callback) can interrupt in-flight unacknowledgements and lose messages.
- **Handle signals once** — a `called` guard prevents a second signal from racing the first shutdown's callback.
- **Don't call shutdown during initialization** — `initialize()` in flight plus `shutdown()` rejects with `PanicError`. Either await initialization first, or check `RedisSMQ.isRunning()` before proceeding.
- **Shutdown before closing Redis** — RedisSMQ needs Redis to unacknowledge in-flight messages and deregister consumers. Closing the Redis client underneath the library leaves the queue in an inconsistent state.
- **`shutdown()` is not `disconnect()`** — it releases the library's connections and stops its background workers, but does not terminate the process. Your application owns `process.exit()`.

## Checking Shutdown State

```javascript
if (RedisSMQ.isRunning()) {
  await RedisSMQ.shutdown();
}
```

`RedisSMQ.isRunning()` returns `true` between the completion of a successful `initialize()` and the beginning of `shutdown()`. It returns `false` during startup, during shutdown, and after shutdown.

## Related

- [Graceful Shutdown Concepts](https://github.com/weyoss/redis-smq-docs) — How shutdown works
- [Simplified API](simplified-redis-smq-api.md) — Factory methods and automatic cleanup
- [Consuming Messages](consuming-messages.md) — Retry policy and unacknowledgement actions
