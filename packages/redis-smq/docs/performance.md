[RedisSMQ](../README.md) / [Docs](README.md) / Performance

# RedisSMQ Performance

This document explains the key factors that impact RedisSMQ performance, how to tune for high throughput and
predictable latency, and how to measure throughput in producer-only, consumer-only, and combined scenarios.

## Overview

RedisSMQ is designed for high performance with a callback-based architecture, a small memory footprint, and careful use
of Redis primitives. In production, you can further optimize performance by disabling or avoiding optional features
that add overhead:

- Logging (especially console logging)
- Message audit for acknowledged and dead-lettered messages
- EventBus (leave disabled unless you need system-wide events)
- Priority queues (choose FIFO/LIFO when possible)
- Routing via exchanges:
  - Fastest: publish directly to a queue (no exchange)
  - Next-best: direct exchange (exact-match routing)
  - Heavier: topic exchange (wildcard routing)
  - Fanout exchange (broadcast to all bindings)
- Multiplexing (disable if you need maximum per-queue throughput)

Prerequisites:

- Initialize once per process:
  - `RedisSMQ.initialize(redisConfig, cb)`, or
  - `RedisSMQ.initializeWithConfig(redisSMQConfig, cb)`
- Create components via RedisSMQ factory methods (recommended).
- When created via RedisSMQ, you typically do not need to shut down components individually. Prefer a single
  `RedisSMQ.shutdown(cb)` at application exit.

See also:

- Messages: [messages.md](messages.md)
- Consuming messages: [consuming-messages.md](consuming-messages.md)
- Queue types: [queues.md](queues.md)
- Delivery models: [queue-delivery-models.md](queue-delivery-models.md)
- Multiplexing: [multiplexing.md](multiplexing.md)
- Message handler worker threads: [message-handler-worker-threads.md](message-handler-worker-threads.md)
- Message audit: [message-audit.md](message-audit.md)

## What drives performance

- Queue type
  - LIFO/FIFO: fastest (simple list ops, BRPOPLPUSH-based flow)
  - Priority: slower (pooling + Lua scripting add overhead)
- Delivery model
  - Point-to-Point: single consumer per message
  - Pub/Sub: fan-out across consumer groups increases total work
- Routing path
  - Direct queue publishing (no exchange): zero exchange overhead, fastest
  - Direct exchange: minimal routing overhead
  - Topic exchange: wildcard matching adds cost
  - Fanout exchange: routes to all bound queues (multiplies work)
- Message size and payload shape
  - Smaller, shallow JSON bodies serialize/deserialize faster
- Logging
  - Disable or lower verbosity in production
- Message audit
  - Auditing acknowledged and dead-lettered messages adds Redis ops and memory usage
- EventBus
  - Disabled by default; enabling adds PubSub activity
- Consumer model
  - Worker threads isolate handlers but introduce IPC and marshalling overhead
  - Multiplexing reduces connections but serializes dequeue across queues
- Redis topology
  - Local network, latency, and CPU matter; Redis is single-threaded per instance
  - Persistence settings (AOF/RDB) can impact latency
- Client/runtime
  - Node.js version and flags, GC settings, and chosen Redis client can affect throughput

## Practical tuning checklist

- Use LIFO/FIFO queues unless you strictly need priority ordering
- Prefer the Point-to-Point delivery model when fan-out isn’t required
- Route with the simplest mechanism:
  - Prefer publishing directly to a queue (no exchange) when possible
  - If you need an exchange, prefer direct over topic; use topic only when wildcard routing is required
- Keep messages small; store heavy payloads externally and reference them by ID
- Disable or lower logging levels in production
- Keep EventBus disabled unless observability requires it
- Leave acknowledged/dead-lettered message audit disabled unless needed
- Avoid multiplexing for hot queues; isolate hot queues in dedicated consumers
- Consider worker threads only when handler isolation is required; measure overhead
- Co-locate producers/consumers with Redis or ensure low-latency networking
- Allocate enough CPU to the Redis host; avoid noisy neighbors in shared environments
- Tune Redis persistence and networking to your latency/consistency needs

## Throughput measurements

Throughput is messages per second under:

1. Producer-only: produce as fast as possible without consumers
2. Consumer-only: consume from a preloaded queue with no producers
3. Combined: producers and consumers active concurrently

Interpreting results:

- Producer-only highlights publishing capacity and routing overhead
- Consumer-only highlights dequeue + handler overhead and queue mechanics
- Combined reflects end-to-end system behavior, including contention

Your numbers will depend on hardware, network, message size, configuration, and handler logic. Always benchmark in an environment representative of production.

## Example environment (illustrative)

- CPU: 4–8 vCPU
- RAM: 8–16 GB
- OS: modern Linux (e.g., Debian/Ubuntu)
- Redis: single instance on the same LAN/host, default settings (no special tuning)

Note: Redis is single-threaded per instance; if a single instance becomes a bottleneck, consider sharding queues across multiple Redis instances.

## Legacy example results

The table below shows historical example results from a modest VM and should be considered illustrative only. Do not treat these as current performance targets.

| Scenario                    | Producer Rate (msg/s) | Consumer Rate (msg/s) |
| --------------------------- | --------------------- | --------------------- |
| 1 Producer                  | 23K+                  | 0                     |
| 10 Producers                | 96K+                  | 0                     |
| 1 Consumer                  | 0                     | 13K+                  |
| 10 Consumers                | 0                     | 49K+                  |
| 1 Producer + 1 Consumer     | 22K+                  | 12K+                  |
| 10 Producers + 10 Consumers | 45K+                  | 27K+                  |
| 10 Producers + 20 Consumers | 32K+                  | 32K+                  |

Your results will vary. Use these as a rough directional reference only.

## Measuring throughput yourself

Producer-only sketch:

- Initialize via RedisSMQ.initialize(...)
- Create a Producer and call run(cb)
- Produce N messages as fast as possible, measure time

Consumer-only sketch:

- Preload a queue with N messages
- Create a Consumer, register a fast handler, run, and measure time to drain

Combined:

- Start producer and consumer simultaneously
- Measure end-to-end time to send and acknowledge N messages

Tips for accurate measurement:

- Pin CPU and minimize background load
- Disable logging
- Use stable message bodies and sizes
- Warm up before timing
- Repeat multiple runs and report median/p95

## Feature impact summary

- Fastest path: FIFO/LIFO + direct queue publishing (no exchange) + Point-to-Point + no logging + no storage + no EventBus
- Next-best: direct exchange instead of no-exchange routing
- Slower path examples:
  - Topic exchanges (pattern routing)
  - Fanout exchanges (broadcast to all bindings)
  - Priority queues (Lua + additional ops)
  - Pub/Sub delivery (fan-out across consumer groups)
  - Worker threads (serialization and scheduling overhead)
  - Multiplexing (fewer connections, lower concurrency per process)

## Troubleshooting low throughput

- High consumer latency
  - Check handler code: synchronous CPU, blocking IO, or slow dependencies
  - Consider worker threads if isolation helps remove GC pressure in the main thread
- Redis saturation
  - Monitor CPU and command latency; consider scaling vertically or sharding queues
- Network latency
  - Co-locate services or reduce cross-zone traffic
- Backpressure and retries
  - Reduce retry thresholds or delays if overload cascades
- Configuration regressions
  - Ensure logging/storage/EventBus are disabled if not needed
  - Validate that multiplexing is off for hot queues

## Conclusion

RedisSMQ can deliver high throughput with predictable latency when configured appropriately. Use LIFO/FIFO queues for raw speed, route with the simplest option first (publish directly to queues when possible), keep optional features off unless needed, measure with realistic payloads and handlers, and validate performance at the scale you expect in production.

For deeper dives and related topics:

- Consuming messages: [consuming-messages.md](consuming-messages.md)
- Producing messages: [producing-messages.md](producing-messages.md)
- Multiplexing: [multiplexing.md](multiplexing.md)
- Message handler worker threads: [message-handler-worker-threads.md](message-handler-worker-threads.md)
- Queue rate limiting: [queue-rate-limiting.md](queue-delivery-models.md)
