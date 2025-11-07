[RedisSMQ](../README.md) / [Docs](README.md) / RedisSMQ Architecture Overview

# RedisSMQ Architecture Overview

This document provides a high-level overview of the RedisSMQ architecture and how it facilitates reliable message
queuing and processing at scale.

---

## High-level architecture

At a glance, RedisSMQ consists of:

- **RedisSMQ class (entry point)**
  - Initializes once per process (shared Redis connection pool)
  - Optionally bootstraps persisted configuration and starts EventBus (if enabled)
  - Provides factory methods to create producers, consumers, exchanges, and managers
  - Handles graceful shutdown of all components created via the class
- **Producers**
  - Publish messages directly to queues (fastest) or via exchanges (direct/topic/fanout)
- **Exchanges**
  - Route published messages to one or more queues based on routing keys/patterns (optional)
- **Queues**
  - Store messages awaiting delivery to consumers
  - Support FIFO, LIFO, and Priority
  - Support two delivery models: Point-to-Point and Pub/Sub
- **Consumers**
  - Dequeue and process messages
  - In Pub/Sub, consumers belong to consumer groups (fan-out across groups)
- **Optional subsystems**
  - Scheduler (delayed/CRON/repeating messages)
  - Rate limiting (throttle consumption per queue)
  - Message audit (acknowledged/dead-lettered messages)
  - EventBus (internal system events)

All components coordinate through Redis using atomic operations and Lua scripts where needed for correctness and
performance.

## Initialization and lifecycle

- **Required: Initialize once per process**
  - `RedisSMQ.initialize(redisConfig, cb)`
  - or `RedisSMQ.initializeWithConfig(redisSMQConfig, cb)` to persist and share configuration
- **Create components via RedisSMQ factory methods (recommended)**
  - e.g., `createProducer()`, `createConsumer()`, `createQueueManager()`, `createTopicExchange()`, etc.
- **Shutdown**
  - Prefer a single RedisSMQ.shutdown(cb) at application exit
  - Components created via RedisSMQ are tracked and shut down automatically
  - Instances created manually can be shut down individually using their shutdown methods

## Message flow

**1) Produce**

- Direct Queue Publishing (No Exchange) [fastest]: Producer publishes directly to a specific queue.
- Exchange-based routing (optional): Producer publishes to an exchange (direct/topic/fanout); the exchange resolves
  bindings and routes to one or more queues.

**2) Enqueue**

- Messages are persisted in Redis queue structures:
  - FIFO/LIFO queues rely on list-based operations (fast path)
  - Priority queues use sorted data structures and Lua (additional overhead, but prioritized ordering)

**3) Deliver**

- Delivery model is applied per queue:
  - Point-to-Point: each message is delivered to exactly one consumer at a time
  - Pub/Sub: a copy of the message is delivered to each consumer group; within a group, one consumer receives it

**4) Process**

- Consumer runs the user-defined handler
- Optional: worker threads can isolate handlers for better fault tolerance and to reduce main thread pressure

**5) Acknowledge / Retry / Dead-letter**

- Acknowledge: on success, the message is acknowledged; optionally stored in dedicated storage if message audit is enabled
- Retry: on failure, the message is re-queued with optional retryDelay until retryThreshold is reached
- Dead-letter: after exceeding retryThreshold, the message can be moved to the dead-letter queue (and optionally stored)

**6) Optional storage and introspection**

- If enabled, acknowledged and dead-lettered messages are stored for observability and tooling (UI/API)

## Exchanges vs direct publishing

- **Direct Queue Publishing (No Exchange)**
  - Producer sets the target queue (setQueue(...)) and does not set an exchange
  - Fastest path: avoids exchange lookup/binding resolution
  - Best for known destinations and task queues

- **Direct Exchange**
  - Exact routing key match to bound queues
  - Lightweight routing with low overhead
  - Useful when decoupling producers from queue names but still using deterministic routing

- **Topic Exchange**
  - Wildcard routing (AMQP-style patterns with . separator, \* and # wildcards)
  - Flexible and dynamic, but with added matching overhead

- **Fanout Exchange**
  - Broadcast to all queues bound to the exchange (no routing key)
  - Simplest logic but multiplies downstream work

Routing choice affects only which queues receive messages. Delivery semantics are defined by the target queues'
delivery models.

## Delivery models

- **Point-to-Point**
  - For each message, only one consumer processes it at a time
  - Ideal for task distribution and work queues

- **Pub/Sub (with consumer groups)**
  - Each consumer group receives a copy of the message
  - Within a group, one consumer processes the message
  - Ideal for fan-out to multiple services with independent processing pipelines

## Reliability and ordering

- **Atomicity**
  - Critical operations (enqueue, dequeue, ack/retry) use atomic Redis commands and Lua to ensure correctness
- **Visibility timeout / consume timeout**
  - Detects stuck handlers; messages are re-queued for retry if consumers do not acknowledge in time
- **Ordering**
  - FIFO/LIFO queues provide natural ordering semantics
  - Priority queues trade strict FIFO/LIFO for prioritized delivery
- **Audit options**
  - Message audit for acknowledged/dead-lettered messages is optional and disabled by default to minimize overhead

## Scheduling and delay

- **Delayed delivery**
  - `setScheduledDelay(...)` to deliver after a fixed delay
- **CRON scheduling**
  - `setScheduledCRON(...)` for calendar-based schedules
- **Repeating**
  - `setScheduledRepeat(...)`, `setScheduledRepeatPeriod(...)`

The scheduler manages due messages and enqueues them for consumption when appropriate.

## Rate limiting

- Queue-level throttling
  - Limit the number of messages consumed per interval per queue
  - Useful for protecting downstream services and staying within external rate limits

## Namespaces and key space

- Namespace provides isolation across environments/apps (e.g., my_app_dev, my_app_prod)
- All Redis keys are namespaced, allowing multiple independent deployments on the same Redis instance

## EventBus (optional)

- Disabled by default; enable in configuration to emit and subscribe to internal lifecycle and flow events
- Useful for observability, debugging, and integration with external monitoring

## Configuration (optional)

- Persisted configuration (via `initializeWithConfig`) can be shared across processes
- Use the Configuration class to inspect or update settings at runtime (optional)
- Most applications can rely on `RedisSMQ.initialize(...)` and avoid direct configuration management

## Performance considerations

- Fastest routing: direct queue publishing (no exchange) > direct exchange > topic exchange; fanout multiplies work
- Fastest queues: FIFO/LIFO; priority adds overhead
- Keep messages small and avoid heavy payloads in-line
- Disable optional features (logging, EventBus, message audit) unless needed
- Avoid multiplexing for hot queues; use dedicated consumers for maximum throughput

## Graceful shutdown

- If components are created via the RedisSMQ class, a single RedisSMQ.shutdown(cb) call at application exit:
  - Stops the EventBus (if enabled and managed by RedisSMQ)
  - Shuts down tracked components (producers, consumers, managers, exchanges)
  - Closes the shared Redis connection pool
- You may still shut down instances individually when needed (e.g., stop a specific consumer earlier)

---

This overview should help you reason about how producers, exchanges, queues, delivery models, and consumers interact
through Redis to provide a reliable and scalable messaging platform. For deeper dives, see:

- Messages: [messages.md](messages.md)
- Producing/Consuming: [producing-messages.md](producing-messages.md), [consuming-messages.md](consuming-messages.md)
- Exchanges: [message-exchanges.md](message-exchanges.md), [exchanges-and-delivery-models.md](exchanges-and-delivery-models.md)
- Queues and delivery models: [queues.md](queues.md), [queue-delivery-models.md](queue-delivery-models.md)
- Performance: [performance.md](performance.md)
- Multiplexing: [multiplexing.md](multiplexing.md)
- Queue rate limiting: [queue-rate-limiting.md](queue-rate-limiting.md)
- Worker threads: [message-handler-worker-threads.md](message-handler-worker-threads.md)
