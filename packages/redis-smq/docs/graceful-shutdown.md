[RedisSMQ](../README.md) / [Docs](README.md) / Graceful Shutdown

# Graceful Shutdown

RedisSMQ is designed to handle failures and unexpected shutdowns without losing messages. Core operations are
transactional to preserve consistency and integrity.

With the RedisSMQ class:

- Initialize once per process using RedisSMQ.initialize(...) or RedisSMQ.initializeWithConfig(...).
- If you created components via RedisSMQ factory methods (e.g., createProducer, createConsumer, createQueueManager),
  you do not need to shut them down individually. Prefer calling RedisSMQ.shutdown(cb) at the end to close shared
  infrastructure and all tracked components automatically.
- You can still call shutdown(cb) on an individual instance if you want to stop it earlier or if it was not created via
  RedisSMQ.

## Recommended shutdown order

1. Stop your application from accepting new work (e.g., stop HTTP server).
2. Optionally call shutdown(cb) on specific components you want to stop early (e.g., a Consumer), if needed.
3. Call RedisSMQ.shutdown(cb) to close shared infrastructure and automatically shut down components created via
   RedisSMQ.

Note

- If EventBus is enabled in configuration and started by RedisSMQ, RedisSMQ.shutdown(cb) will shut it down. If you
  started EventBus manually, you may shut it down explicitly.

## Example: application-wide shutdown (recommended)

```typescript
import { RedisSMQ } from 'redis-smq';

// Assume RedisSMQ.initialize(...) or initializeWithConfig(...) was called at startup.
const producer = RedisSMQ.createProducer();
const consumer = RedisSMQ.createConsumer();

producer.run((err) => {
  if (err) return console.error('Producer start failed:', err);
  console.log('Producer ready');
});
consumer.run((err) => {
  if (err) return console.error('Consumer start failed:', err);
  console.log('Consumer ready');
});

function makeShutdownOnce() {
  let called = false;
  return () => {
    if (called) return;
    called = true;

    // Stop accepting new work here if applicable (e.g., close HTTP server).

    // Prefer a single call: RedisSMQ.shutdown will close all components created via RedisSMQ.
    RedisSMQ.shutdown((err) => {
      if (err) {
        console.error('Shutdown finished with errors:', err);
        process.exitCode = 1;
      } else {
        console.log('Shutdown completed cleanly');
      }
    });
  };
}

const requestShutdown = makeShutdownOnce();
process.once('SIGINT', requestShutdown);
process.once('SIGTERM', requestShutdown);
```

## Example: shutting down a single Consumer (optional)

It is still valid to shut down a single instance if you need to stop it earlier than the rest of the system, or if it
was not created via RedisSMQ.

```typescript
consumer.shutdown((err) => {
  if (err) {
    console.error('Consumer shutdown error:', err);
  } else {
    console.log('Consumer shut down successfully');
  }
});
```

## What RedisSMQ.shutdown(cb) handles automatically

RedisSMQ.shutdown(cb) automatically shuts down shared infrastructure and any components that were created via RedisSMQ
factory methods (such as producers, consumers, managers, and exchanges). If you created instances without using
RedisSMQ factory methods, shut them down explicitly or ensure they are tracked by your application.

For a complete list of available components and their APIs, see the [API Reference](api/README.md).

## Common pitfalls

- Not initialized: Always create components after RedisSMQ.initialize(...) or RedisSMQ.initializeWithConfig(...).
- Multiple signals: Ensure your shutdown logic runs once even if multiple signals arrive.
- Forcing exit: Avoid calling process.exit() immediately; wait for shutdown callbacks to release resources and
  acknowledge messages.
