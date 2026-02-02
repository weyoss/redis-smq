[RedisSMQ](../README.md) / [Docs](README.md) / Configuration

# Configuration

Set up RedisSMQ with your Redis connection and optional features. Initialize once when your app starts.

## Quick Start

### Basic Setup (Most Common)

```javascript
const { RedisSMQ } = require('redis-smq');
const { ERedisConfigClient } = require('redis-smq-common');

RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
  (err) => {
    if (err) console.error('Failed:', err);
    else console.log('RedisSMQ ready');
  },
);
```

### With Optional Features

```javascript
RedisSMQ.initializeWithConfig(
  {
    namespace: 'myapp',
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: {
        host: '127.0.0.1',
        port: 6379,
      },
    },
    logger: { enabled: true },
    messageAudit: false,
    eventBus: { enabled: true },
  },
  (err) => {
    if (err) console.error('Failed:', err);
    else console.log('Setup complete');
  },
);
```

**Note**: Use `initializeWithConfig` for first-time setup only. After configuration is saved, use `initialize()`.

## Configuration Options

### Core Settings

```javascript
const config = {
  namespace: 'myapp',
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
      // Track failed messages with limits
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

## When to Use Each Method

### `RedisSMQ.initialize(redisConfig, callback)`

- **Use for**: Normal application startup
- **When**: Configuration already exists in Redis
- **Example**: Daily restarts, deployment updates

```javascript
// After initial setup, use this:
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
  callback,
);
```

### `RedisSMQ.initializeWithConfig(fullConfig, callback)`

- **Use for**: First-time setup or configuration changes
- **When**: Setting up new environment/application or changing Redis settings
- **Example**: Initial deployment, changing namespace

```javascript
// First time or when changing config:
RedisSMQ.initializeWithConfig(
  {
    namespace: 'new-app',
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: {
        host: '127.0.0.1',
        port: 6379,
      },
    },
    // ... other settings
  },
  callback,
);
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
// Application
namespace: 'myapp';

// Environment
namespace: 'myapp-staging';
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

### 4. Store Configuration in Redis

```javascript
// First deploy: save config to Redis
RedisSMQ.initializeWithConfig(fullConfig, callback);

// Subsequent starts: load from Redis
RedisSMQ.initialize(redisConfig, callback);
```

---

**Related**:

- [Message Audit](message-audit.md) - Tracking processed messages
- [EventBus](event-bus.md) - System event monitoring
- [Performance](performance.md) - Optimization tips
- [API Reference](api/classes/Configuration.md) - Complete configuration options
