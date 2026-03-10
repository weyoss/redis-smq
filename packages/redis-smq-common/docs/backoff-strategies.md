[RedisSMQ Common Library](../README.md) / Backoff Strategies

# Backoff Strategies

## Overview

RedisSMQ Common provides four different backoff strategies for retrying failed operations. Each strategy has unique
characteristics making it suitable for different scenarios.

## Table of Contents

- [Common Interface](#common-interface)
- [ExponentialBackoff](#exponentialbackoff)
- [LinearBackoff](#linearbackoff)
- [LogarithmicBackoff](#logarithmicbackoff)
- [PolynomialBackoff](#polynomialbackoff)
- [Max Attempts Support](#max-attempts-support)
- [Jitter](#jitter)

## Common Interface

All backoff strategies share the same interface:

```typescript
// Configuration
interface IBackoffConfig {
  baseDelay?: number; // default: 1000ms
  maxDelay?: number; // default: 60000ms
  maxAttempts?: number; // default: 0 (unlimited)
  jitter?: boolean; // default: true
}

// Usage
const backoff = new ExponentialBackoff(logger, config);

// Start the backoff instance
backoff.run((err) => {
  if (err) {
    console.error('Failed to start backoff:', err);
    return;
  }

  // Execute operation with retries
  backoff.execute(
    (cb) => {
      // Your operation here
      someAsyncOperation(cb);
    },
    (err, result) => {
      if (err) {
        console.error('Operation failed after retries:', err);
      } else {
        console.log('Operation succeeded:', result);
      }

      // Shutdown when done
      backoff.shutdown(() => {
        console.log('Backoff shut down');
      });
    },
  );
});
```

---

## ExponentialBackoff

**Formula:** `delay = baseDelay * factor^attempts` (default factor = 2)

### Characteristics

- 📈 **Growth**: Accelerating (doubles each time)
- 🎯 **Best for**: Server protection, distributed systems
- ⚡ **Reaches max**: Quickly

### Use Cases

- **API rate limiting** - Quickly backs off to prevent abuse
- **Database connection failures** - Prevents connection storm during recovery
- **Microservice communication** - Protects downstream services
- **Thundering herd prevention** - Combined with jitter, excellent for distributed retries

### Example Progression (baseDelay=1000, factor=2)

```
Attempt 0: 1000ms
Attempt 1: 2000ms
Attempt 2: 4000ms
Attempt 3: 8000ms
Attempt 4: 16000ms
Attempt 5: 32000ms (capped at maxDelay)
```

### Example Usage

```typescript
const backoff = new ExponentialBackoff(logger, {
  baseDelay: 1000,
  maxDelay: 30000,
  factor: 2,
  jitter: true,
});

backoff.run((err) => {
  if (err) return console.error('Start failed:', err);

  backoff.execute(
    (cb) => {
      // Simulate database connection
      connectToDatabase(cb);
    },
    (err, connection) => {
      if (err) {
        console.error('Failed to connect after retries');
      } else {
        console.log('Connected successfully');
      }

      backoff.shutdown(() => {
        console.log('Backoff stopped');
      });
    },
  );
});
```

### When to Use

✅ Server overload scenarios  
✅ Distributed systems with many clients  
✅ When you need to back off aggressively  
✅ Rate-limited APIs

❌ Don't use when you need predictable timing  
❌ Avoid for user-facing operations (can feel "exponential" to users)

## LinearBackoff

**Formula:** `delay = baseDelay * attempts`

### Characteristics

- 📈 **Growth**: Constant (adds baseDelay each time)
- 🎯 **Best for**: Predictable patterns, user experience
- ⚡ **Reaches max**: Slowly and predictably

### Use Cases

- **Health checks** - Predictable polling intervals
- **Mobile app background sync** - User-friendly progression
- **Queue processing** - Predictable load on workers
- **Testing** - Deterministic retry patterns
- **Resource-constrained environments** - Predictable resource usage

### Example Progression (baseDelay=1000)

```
Attempt 0: 0ms    (immediate retry)
Attempt 1: 1000ms
Attempt 2: 2000ms
Attempt 3: 3000ms
Attempt 4: 4000ms
Attempt 5: 5000ms
```

### Example Usage

```typescript
const backoff = new LinearBackoff(logger, {
  baseDelay: 5000,
  maxDelay: 30000,
  jitter: false, // Disable jitter for predictable polling
});

backoff.run(() => {
  backoff.execute(
    (cb) => {
      // Health check endpoint
      http
        .get('https://api.example.com/health', (res) => {
          if (res.statusCode === 200) {
            cb(null, 'healthy');
          } else {
            cb(new Error(`Health check failed: ${res.statusCode}`));
          }
        })
        .on('error', cb);
    },
    (err, status) => {
      if (err) {
        console.log('Service not healthy yet, will retry...');
      } else {
        console.log('Service is healthy:', status);
        backoff.shutdown();
      }
    },
  );
});
```

### When to Use

✅ User-facing operations  
✅ Predictable retry patterns  
✅ Testing and debugging  
✅ Resource-constrained environments

❌ Don't use for server protection (not aggressive enough)  
❌ Avoid for thundering herd scenarios (no jitter spread)

## LogarithmicBackoff

**Formula:** `delay = baseDelay * log2(attempts + 2)`

### Characteristics

- 📈 **Growth**: Fast initially, then plateaus
- 🎯 **Best for**: Balanced approach
- ⚡ **Reaches max**: Moderately

### Use Cases

- **Long-running processes** - Smooth, non-aggressive growth
- **External API calls** - Balanced between UX and server protection
- **File uploads/downloads** - Predictable but increasing waits
- **Progressive enhancement** - Gradually increasing patience

### Example Progression (baseDelay=1000)

```
Attempt 0: 1000ms  (log2(2) = 1.0)
Attempt 1: 1585ms  (log2(3) = 1.585)
Attempt 2: 2000ms  (log2(4) = 2.0)
Attempt 3: 2322ms  (log2(5) = 2.322)
Attempt 4: 2585ms  (log2(6) = 2.585)
Attempt 5: 2807ms  (log2(7) = 2.807)
Attempt 6: 3000ms  (log2(8) = 3.0)
Attempt 7: 3170ms  (log2(9) = 3.17)
Attempt 8: 3322ms  (log2(10) = 3.322)
```

### Example Usage

```typescript
const backoff = new LogarithmicBackoff(logger, {
  baseDelay: 2000,
  maxDelay: 30000,
});

backoff.run(() => {
  backoff.execute(
    (cb) => {
      // File upload that might fail
      uploadFile('large-file.zip', (err, result) => {
        if (err && err.code === 'NETWORK_ERROR') {
          cb(err); // Will retry with logarithmic backoff
        } else if (err) {
          cb(err); // Non-retryable error
        } else {
          cb(null, result);
        }
      });
    },
    (err, result) => {
      if (err) {
        console.error('Upload failed permanently:', err);
      } else {
        console.log('Upload completed:', result);
      }
      backoff.shutdown();
    },
  );
});
```

### When to Use

✅ Balanced retry strategies  
✅ Long-running operations  
✅ When you need moderate growth  
✅ User-facing features needing patience

❌ Don't use for emergency backoff (too slow initially)  
❌ Avoid when you need precise control

## PolynomialBackoff

**Formula:** `delay = baseDelay * (attempts + 1)^(1/3)` (cubic root)

### Characteristics

- 📈 **Growth**: Smooth, gradually decreasing rate
- 🎯 **Best for**: Natural, organic growth patterns
- ⚡ **Reaches max**: Slowly and smoothly

### Use Cases

- **Natural resource allocation** - Mimics real-world patterns
- **Background jobs** - Smooth load increase
- **Batch processing** - Gradual retry escalation
- **Machine learning pipelines** - Controlled retry backoff

### Example Progression (baseDelay=1000)

```
Attempt 0: 1000ms  (1^(1/3) = 1.0)
Attempt 1: 1260ms  (2^(1/3) = 1.26)
Attempt 2: 1442ms  (3^(1/3) = 1.442)
Attempt 3: 1587ms  (4^(1/3) = 1.587)
Attempt 4: 1710ms  (5^(1/3) = 1.71)
Attempt 5: 1817ms  (6^(1/3) = 1.817)
Attempt 6: 1913ms  (7^(1/3) = 1.913)
Attempt 7: 2000ms  (8^(1/3) = 2.0)
Attempt 8: 2080ms  (9^(1/3) = 2.08)
Attempt 9: 2154ms  (10^(1/3) = 2.154)
```

### Example Usage

```typescript
const backoff = new PolynomialBackoff(logger, {
  baseDelay: 5000,
  maxDelay: 60000,
});

backoff.run(() => {
  let batchId = 0;

  function processNextBatch() {
    backoff.execute(
      (cb) => {
        // Process batch of data
        processBatch(`batch-${batchId++}`, (err, result) => {
          if (err && err.retryable) {
            cb(err); // Will retry with polynomial backoff
          } else if (err) {
            cb(err); // Non-retryable error
          } else {
            cb(null, result);
          }
        });
      },
      (err, result) => {
        if (err) {
          console.error('Batch processing failed:', err);
          backoff.shutdown();
        } else {
          console.log('Batch processed:', result);
          if (batchId < 10) {
            processNextBatch(); // Process next batch
          } else {
            backoff.shutdown();
          }
        }
      },
    );
  }

  processNextBatch();
});
```

### When to Use

✅ Natural, organic growth patterns  
✅ Machine learning retry logic  
✅ Smooth load escalation  
✅ Background processing

❌ Don't use for time-critical operations  
❌ Avoid when you need aggressive backoff

## Max Attempts Support

All backoff strategies support retry attempts limiting:

```typescript
const backoff = new ExponentialBackoff({ maxAttempts: 3 }, logger);

backoff.run(() => {
  backoff.execute(
    (cb) => {
      someAsyncOperation(cb);
    },
    (err, result) => {
      if (err) {
        console.error('Operation failed after 3 retries:', err);
      }

      // Success
      // ...
    },
  );
});
```

## Jitter

Jitter adds randomness to prevent the "thundering herd" problem where many clients retry simultaneously.

### How Jitter Works

```text
// With jitter enabled (±20%)
delay = calculatedDelay ± 20% random variation

// Example: 1000ms becomes 800-1200ms
```

### Jitter Comparison

| Scenario     | Without Jitter          | With Jitter               |
| ------------ | ----------------------- | ------------------------- |
| 1000 clients | All retry at same times | Retries spread over time  |
| Server load  | Massive spikes          | Smooth distribution       |
| Success rate | Low (all fail together) | High (staggered recovery) |

### When to Use Jitter

✅ **Always use jitter** in distributed systems  
✅ **Critical for** database reconnection logic  
✅ **Essential for** API rate limit handling  
✅ **Important for** microservices with many clients

❌ Only disable jitter for testing/debugging
