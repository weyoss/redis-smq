[RedisSMQ](../README.md) / Documentation

# RedisSMQ Documentation

**RedisSMQ** is a high-performance, Redis-backed message queue library for Node.js. It offers a clean,
process-wide API with support for multiple queue types (FIFO/LIFO/Priority), flexible routing via exchanges
(Direct/Topic/Fanout), Point-to-Point and Pub/Sub delivery models, built-in scheduling, rate limiting, optional
message auditing, worker threads, and more — all while keeping operations atomic and reliable.

> **Recommended reading order**
>
> 1. [Simplified RedisSMQ API](simplified-redis-smq-api.md)
> 2. [Configuration](configuration.md)
> 3. [Producing Messages](producing-messages.md) & [Consuming Messages](consuming-messages.md)
> 4. [Queues](queues.md) & [Message Exchanges](message-exchanges.md)

---

## Table of Contents

### 🚀 Getting Started

- [Simplified RedisSMQ API](simplified-redis-smq-api.md) — _One initialization, factory methods, automatic cleanup_
- [Configuration](configuration.md) — _Redis connection, persisted settings, optional features_
- [ESM & CJS Modules](esm-cjs-modules.md) — _Both module systems fully supported_
- [Version Compatibility](version-compatibility.md) — _Keep all RedisSMQ packages aligned_
- [Graceful Shutdown](graceful-shutdown.md) — _Recommended shutdown patterns_

### 📚 Core Concepts

- [RedisSMQ Architecture Overview](redis-smq-architecture.md) — _High-level design, message flow, lifecycle_
- [Queues](queues.md) — _FIFO, LIFO, Priority queues_
- [Messages](messages.md) — _ProducibleMessage, TTL, priority, retries_
- [Producing Messages](producing-messages.md) — _Direct queues vs exchanges_
- [Consuming Messages](consuming-messages.md) — _Handlers, acknowledgments, consumer groups_
- [Message Exchanges](message-exchanges.md) — _Direct, Topic, Fanout routing_
- [Queue Delivery Models](queue-delivery-models.md) — _Point-to-Point vs Pub/Sub_
- [Exchanges and Delivery Models](exchanges-and-delivery-models.md) — _How they work together_

### ⚡ Advanced Features

- [Scheduling Messages](scheduling-messages.md) — _Delay, CRON, repeating messages_
- [Queue Rate Limiting](queue-rate-limiting.md) — _Throttle consumption per queue_
- [Message Audit](message-audit.md) — _Track acknowledged & dead-lettered messages_
- [EventBus](event-bus.md) — _Real-time observability of internal events_
- [Queue State Management System](queue-state-management-system.md) — _Pause, stop, resume queues with audit trail_
- [Validating Queue Operations](validating-queue-operations.md) — _State-based operation guards_

### 🔧 Reliability & Performance

- [Message Batch Acknowledgments](message-batch-acknowledgements.md) — _Improve throughput by batching message acknowledgments_
- [Message Batch Unacknowledgments](message-batch-unacknowledgements.md) — _Efficiently handle failed messages in batches_
- [Message Handler Worker Threads](message-handler-worker-threads.md) — _Run heavy handlers in isolated threads_
- [Multiplexing](multiplexing.md) — _Share one Redis connection across many queues_
- [Performance](performance.md) — _Tuning tips, throughput benchmarks, fast paths_

### 🛠️ Tools & Interfaces

Manage RedisSMQ through various interfaces:

- **[HTTP REST API](../../redis-smq-rest-api/README.md)** — _Integrate RedisSMQ with other applications via HTTP API_
- **[Web UI](../../redis-smq-web-ui/README.md)** — _Use the web interface for easy queue and message management_
- **[Redis Server Helper](../../redis-smq-common/docs/redis-server.md)** — _Start a Redis server instance for development and testing._

### 📖 Reference

- **[API Reference](api/README.md)** — _Complete API documentation_
- **[FAQs](faqs/README.md)** — _Frequently asked questions and troubleshooting_

### 🆘 Need Help?

- **[GitHub Repository](/README.md)** — _Browse the source code_
- **[Issue Tracker](https://github.com/weyoss/redis-smq/issues)** — _Report bugs or request features_
- **[Changelog](/CHANGELOG.md)** — _Stay updated with the latest changes_

---

## Navigation Tips

- New to RedisSMQ? → Start with Simplified RedisSMQ API and Configuration.
- Need maximum speed? → Read Performance and prefer direct queue publishing + FIFO/LIFO + no audit/EventBus.
- Building a microservices event bus? → See Exchanges and Delivery Models + Pub/Sub.
- Debugging? → Enable EventBus and Message Audit.

---

Happy queuing! 🚀
