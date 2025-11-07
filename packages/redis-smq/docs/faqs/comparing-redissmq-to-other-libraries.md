[RedisSMQ](../README.md) / [Docs](../README.md) / [FAQs](README.md) / What are the key features of RedisSMQ and how do they differ from other messaging libraries?

# What are the key features of RedisSMQ and how do they differ from other messaging libraries?

RedisSMQ is a high-performance, Redis-backed message queue for Node.js with a simple process-wide API and a rich set
of features. Below are its core capabilities, design trade-offs, and an objective comparison to other popular tools.

## Highlights (what you get out of the box)

- **High performance**
  - Optimized queue operations on Redis primitives and Lua where needed.
  - Fastest routing path: direct queue publishing (no exchange) for minimal overhead; direct exchange as the next-best option. See [Performance](../performance.md).

- **Simplified process-wide API**
  - Single entry point via the RedisSMQ class.
  - Initialize once per process (RedisSMQ.initialize or RedisSMQ.initializeWithConfig).
  - Create producers, consumers, exchanges, and managers via factory methods.
  - Prefer a single RedisSMQ.shutdown(cb) at exit; components created via RedisSMQ are tracked and shut down automatically.

- **Flexible routing and delivery models**
  - Exchanges: Direct, Topic, Fanout. See [Message Exchanges](../message-exchanges.md).
  - Delivery models: Point-to-Point and Pub/Sub (with consumer groups). See [Queue Delivery Models](../queue-delivery-models.md).

- **Queue strategies**
  - FIFO, LIFO, and Priority queues. See [Queues](../queues.md).

- **Scheduling and rate limiting**
  - Per-message scheduling (delay, CRON, repeat). See [Scheduling Messages](../scheduling-messages.md).
  - Queue-level rate limiting to throttle consumption. See [Queue Rate Limiting](../queue-rate-limiting.md).

- **Observability and storage (optional)**
  - Optional storage for acknowledged and dead-lettered messages with retention policies. See [Message Audit](../message-audit.md).
  - Optional EventBus for internal lifecycle/flow events. See [EventBus](../event-bus.md).

- **Worker thread execution (optional)**
  - Isolate message handlers to improve fault tolerance and reduce main-thread pressure. See [Message Handler Worker Threads](../message-handler-worker-threads.md).

- **ESM and CJS support**
  - Use either module system seamlessly. See [ESM & CJS Modules](../esm-cjs-modules.md).

- **Configuration (optional)**
  - Persist configuration in Redis and share across processes (initializeWithConfig).
  - Direct use of the Configuration class is optional; the RedisSMQ class handles bootstrapping. See [Configuration](../configuration.md).

## Design trade-offs and constraints

- **Requires Redis**
  - Leverages Redis performance and durability characteristics; you must run/manage Redis.
- **Feature scope**
  - Focused on reliable queues, routing, and operational tooling for Node.js.
  - Not a log-based streaming platform; not intended for long-term event retention like Kafka.
- **Priority queues**
  - Provide prioritized delivery at the cost of extra overhead (compared to FIFO/LIFO).

## How RedisSMQ differs from other libraries

The right choice depends on your requirements. Use the notes below to match tools to use cases.

**RedisSMQ vs RabbitMQ**

RedisSMQ provides a process-centric, Node.js-first API layered over Redis, emphasizing minimal latency and operational
simplicity. It supports optional exchanges (Direct, Topic, Fanout) but also enables direct queue publishing for the
fastest path.

Topology and routing live in application code rather than broker-enforced policies, and lifecycle is
streamlined via a single initialize/shutdown entry point. Under the hood, operations use Redis primitives, with Lua
on hot paths, and the library supports both ESM and CJS module formats.

**RedisSMQ vs Apache Kafka**

RedisSMQ focuses on task/queue semantics and low-latency work distribution rather than log-based streams. It provides
at-least-once delivery with acknowledgements, retries, and dead-lettering, plus consumer groups for Pub/Sub without
offset/partition management.

Optional message audit targets near-term operational needs (acknowledged/dead-lettered retention windows) instead of
long-term event retention.

**RedisSMQ vs Other Redis-based job queues**

RedisSMQ differentiates by pairing a cohesive, process-wide API with explicit delivery models (Point-to-Point, Pub/Sub
with groups) and exchange-based routing (Direct/Topic/Fanout) while focusing on performance and simplicity.

It offers multiple queue strategies (FIFO, LIFO, Priority) and advanced ergonomics—per-message scheduling, queue-level
rate limiting, optional handler worker threads for CPU-bound work, and an EventBus for observability.

## When to choose RedisSMQ

- You need fast, reliable queues and simple operations in a Node.js environment.
- You want flexible routing (exchanges) and consumption semantics (Point-to-Point, Pub/Sub with groups).
- You prefer low-latency direct queue publishing (no exchange) on hot paths.
- You want optional features like scheduling, rate limiting, or worker threads without adopting a heavyweight broker
  or streaming platform.
- You already operate Redis and want to avoid running additional broker infrastructure.

When not to choose RedisSMQ

- You need log-based event streams with long-term retention, partitioning, and replay (consider Kafka).
- You require multi-protocol messaging or complex broker policies (consider RabbitMQ).

## See also

- Initialization and simplified API: [Configuration](../configuration.md)
- Exchanges: [Message Exchanges](../message-exchanges.md), [Exchanges and Delivery Models](../exchanges-and-delivery-models.md)
- Delivery semantics: [Queue Delivery Models](../queue-delivery-models.md)
- Queue types: [Queues](../queues.md)
- Performance guidance (direct queue publishing vs exchanges): [Performance](../performance.md)
- Scheduling: [Scheduling Messages](../scheduling-messages.md)
- Rate limiting: [Queue Rate Limiting](../queue-rate-limiting.md)
- Message audit: [Message Audit](../message-audit.md)
- ESM/CJS usage: [ESM & CJS Modules](../esm-cjs-modules.md)
