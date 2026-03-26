[RedisSMQ](../README.md) / [Documentation](README.md) / Dual Callback & Promise Support

# Dual Callback & Promise Support

## Core Philosophy

RedisSMQ is built on a **pure callback-based core**, designed to prioritize performance and efficient resource utilization. The library leverages Node.js native asynchronous patterns without introducing unnecessary abstraction layers that could impact throughput.

To offer flexibility without compromise, RedisSMQ provides a **dual API** that supports both:

- **Traditional Node.js callbacks** — for performance-critical paths
- **Modern Promises and `async/await`** — for cleaner, more maintainable code

You get the best of both worlds.

## Performance-First Architecture

### Pure Callback Foundation

All internal RedisSMQ operations are implemented using pure callbacks to:

- **Minimize overhead** — stay close to native Node.js performance
- **Optimize memory usage** — avoid the additional allocations of promise chains
- **Enable fine-grained control** — provide direct access to the event loop and execution flow
- **Maximize throughput** — essential for high-volume message processing

### Dual API Layer

The public API wraps this foundation to deliver both callback and promise interfaces. This design:

- **Preserves performance** — when using callbacks, there is zero additional overhead
- **Adds promise support** — enables modern `async/await` workflows without refactoring
- **Maintains consistency** — identical behavior regardless of the pattern you choose
- **Supports gradual migration** — mix and match patterns within the same codebase

## API Pattern

Every asynchronous method follows a consistent signature:

```text
method(params, callback?) => Promise<T> | void
```

- **With a callback** — the method executes with zero overhead and invokes the callback upon completion
- **Without a callback** — the method returns a `Promise<T>`, allowing use of `async/await` or promise chaining

---

**Related**:

- [Callback vs Promise vs Async/Await](https://gist.github.com/weyoss/24f9ecbda175d943a48cb7ec38bde821) — a deeper look at asynchronous pattern benchmarks
