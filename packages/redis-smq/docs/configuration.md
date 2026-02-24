[RedisSMQ](../README.md) / [Docs](README.md) / Configuration

# Configuration

Set up RedisSMQ with your Redis connection and optional features. Initialize once when your app starts.

## Understanding the Two Initialization Methods

RedisSMQ has **two different initialization methods** that serve distinct purposes:

| Method                   | Purpose                                    | When to Use                                                   |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------- |
| `initializeWithConfig()` | **Save** complete configuration to Redis   | First-time setup, changing Redis host/port, updating features |
| `initialize()`           | **Load** existing configuration from Redis | Normal application startup (after config is saved)            |

### Important: The Configuration Lives in Redis

RedisSMQ stores its configuration **INSIDE Redis**, not in your application code. This ensures all parts of your system use the same settings.

- `initializeWithConfig()` = **Write** configuration to Redis
- `initialize()` = **Read** configuration from Redis (using just Redis connection details)

## First-Time Setup (Required Once)

**You must call `initializeWithConfig()` at least once** to save your configuration to Redis. This is typically done during initial deployment or when changing Redis connection details.

```javascript
const { RedisSMQ } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

// FIRST-TIME SETUP: Save complete configuration to Redis
RedisSMQ.initializeWithConfig(
  {
    namespace: 'myapp',
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: {
        host: '192.168.1.10', // Your Redis server
        port: 6380, // Custom port
      },
    },
    logger: { enabled: true },
    eventBus: { enabled: true },
    // ... any other configuration
  },
  (err) => {
    if (err) console.error('Setup failed:', err);
    else console.log('Configuration saved to Redis successfully');
  },
);
```

**⚠️ CRITICAL**: If you skip this step and only use `initialize()`, RedisSMQ will use **default settings** (localhost:6379) regardless of what you pass to `initialize()`.

## Normal Application Startup (After Config is Saved)

Once your configuration is saved in Redis, use the simpler `initialize()` method on every application start:

```javascript
// NORMAL STARTUP: Just provide Redis connection to load existing config
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '192.168.1.10', // Must match what you used in initializeWithConfig
      port: 6380,
    },
  },
  (err) => {
    if (err) console.error('Failed to load configuration:', err);
    else {
      // All components now use 192.168.1.10:6380
      console.log('RedisSMQ ready - configuration loaded from Redis');
    }
  },
);
```

## Common Pitfall: Why Components Connect to Wrong Redis

**The Problem:**

```javascript
// ❌ This DOES NOT update RedisSMQ configuration
RedisSMQ.initialize(
  { host: '192.168.1.10', port: 6380 }, // Custom Redis
  (err) => {
    /* ... */
  },
);
// InternalEventBus still connects to localhost:6379! 😕
```

**Why This Happens:**

- `initialize()` only uses the Redis connection to **read** the stored configuration
- If you've never called `initializeWithConfig()`, Redis contains **default configuration** (localhost:6379)
- Internal components use the **stored configuration**, not your connection parameters

**The Solution:**

First-time setup (one-time):

```typescript
RedisSMQ.initializeWithConfig(
  {
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: {
        host: '192.168.1.10',
        port: 6380,
      },
    },
    // ... other configuration options
  },
  (err) => {
    if (err) console.error('Setup failed:', err);
  },
);
```

Subsequent application startups:

```typescript
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '192.168.1.10',
      port: 6380,
    },
  },
  (err) => {
    // Now all components use the correct Redis instance
  },
);
```

## Configuration Options

### Core Settings

```javascript
const config = {
  namespace: 'myapp', // Isolates your app's queues
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
};
```

### Optional Features

```javascript
const config = {
  logger: { enabled: true }, // Console logging
  messageAudit: false, // Track processed messages
  eventBus: { enabled: false }, // System event monitoring
};
```

## Message Audit Configuration

### Enable All Tracking

```javascript
const config = {
  messageAudit: true, // Track both successful and failed messages
};
```

### Selective Tracking

```javascript
const config = {
  messageAudit: {
    acknowledgedMessages: true, // Track successful messages
    deadLetteredMessages: {
      queueSize: 1000, // Keep last 1000 failed messages
      expire: 86400, // Delete after 24 hours (seconds)
    },
  },
};
```

### Advanced Configuration

```javascript
const config = {
  messageAudit: {
    acknowledgedMessages: {
      queueSize: 5000, // Keep last 5000 successful messages
      expire: 43200, // Delete after 12 hours
    },
    deadLetteredMessages: {
      queueSize: 10000, // Keep last 10000 failed messages
      expire: 604800, // Delete after 7 days
    },
  },
};
```

## Managing Configuration

### Check Current Settings

```javascript
const { Configuration } = require('redis-smq');
const config = Configuration.getConfig();

console.log('Namespace:', config.namespace);
console.log('Redis host:', config.redis.options.host);
```

### Update Settings

```javascript
const cfg = Configuration.getInstance();
cfg.updateConfig(
  {
    logger: { enabled: false },
    messageAudit: true,
  },
  (err) => {
    if (err) console.error('Update failed:', err);
    else console.log('Configuration updated');
  },
);
```

### Reset to Defaults

```javascript
cfg.reset((err) => {
  if (err) console.error('Reset failed:', err);
  else console.log('Back to defaults');
});
```

## Best Practices

### 1. Namespace by Environment/Application

```javascript
// Production
namespace: 'myapp-prod';

// Staging
namespace: 'myapp-staging';

// Development
namespace: 'myapp-dev';
```

### 2. Enable Features Only When Needed

```javascript
// Development - full visibility
const config = {
  logger: { enabled: true },
  messageAudit: true,
  eventBus: { enabled: true },
};

// Production - minimal overhead
const config = {
  logger: { enabled: false },
  messageAudit: false,
  eventBus: { enabled: false },
};
```

### 3. Set Reasonable Audit Limits

```javascript
const config = {
  messageAudit: {
    acknowledgedMessages: {
      queueSize: 10000, // Enough for debugging
      expire: 86400, // Clean up daily
    },
  },
};
```

### 4. Remember: One-Time Setup, Then Simple Start

```javascript
// First deploy ONLY: save config
if (process.env.FIRST_TIME_SETUP) {
  RedisSMQ.initializeWithConfig(fullConfig, callback);
}

// All starts: load from Redis
RedisSMQ.initialize(redisConnection, callback);
```

## Quick Reference

| Scenario                       | Method                   | What Happens                     |
| ------------------------------ | ------------------------ | -------------------------------- |
| **New application**            | `initializeWithConfig()` | Saves your config to Redis       |
| **Changed Redis host/port**    | `initializeWithConfig()` | Updates stored config            |
| **Normal app restart**         | `initialize()`           | Loads existing config from Redis |
| **Testing different settings** | `initializeWithConfig()` | Overwrites stored config         |

---

**Related**:

- [Message Audit](message-audit.md) - Tracking processed messages
- [EventBus](event-bus.md) - System event monitoring
- [Performance](performance.md) - Optimization tips
- [API Reference](api/classes/Configuration.md) - Complete configuration options
