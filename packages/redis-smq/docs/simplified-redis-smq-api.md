[RedisSMQ](../README.md) / [Docs](README.md) / Simplified RedisSMQ API

# Simplified RedisSMQ API

The RedisSMQ class provides a high-level, process-wide API that manages the shared Redis connection pool, configuration
bootstrap, various components, and optional EventBus. It is the recommended entry point for most applications.

Key points:

- Required: Initialize once per process using either `RedisSMQ.initialize(...)` or `RedisSMQ.initializeWithConfig(...)`.
- Optional: Direct use of the Configuration class. You don’t need to call Configuration.initialize; `RedisSMQ.initialize`
  does it internally.
- Shutdown: If components are created via RedisSMQ factory methods, you typically do not need to shut them down
  individually. Prefer calling `RedisSMQ.shutdown(cb)`, which closes the shared infrastructure and tracked components
  automatically.

**Simple initialization and usage**

This is the most common pattern - initialize once, use everywhere.

```javascript
// 1. Initialize Redis connection once
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: 'localhost',
      port: 6379,
      db: 0,
    },
  },
  (err) => {
    if (err) {
      console.error('Failed to initialize RedisSMQ:', err);
      return;
    }

    console.log('✅ RedisSMQ initialized successfully');

    // 2. Create components without Redis config - they use the global connection!
    const producer = RedisSMQ.createProducer();
    const consumer = RedisSMQ.createConsumer();

    console.log('✅ Producer and Consumer created (no Redis config needed!)');

    // 3. Start them up
    producer.run((err) => {
      if (err) {
        console.error('Failed to start producer:', err);
        return;
      }

      console.log('✅ Producer is running');

      consumer.run((err) => {
        if (err) {
          console.error('Failed to start consumer:', err);
          return;
        }

        console.log('✅ Consumer is running');

        // 4. Use them normally
        // ...
      });
    });
  },
);
```

**Quick start methods**

Even more convenient - create and start in one call.

```javascript
RedisSMQ.initialize(
  {
    client: ERedisConfigClient.IOREDIS,
    options: { host: 'localhost', port: 6379 },
  },
  (err) => {
    if (err) {
      console.error('Failed to initialize:', err);
      return;
    }

    // Create and start producer in one call
    const producer = RedisSMQ.startProducer((err) => {
      if (err) {
        console.error('Failed to start producer:', err);
        return;
      }

      console.log('✅ Producer created and started in one call');

      // Create and start consumer in one call
      const consumer = RedisSMQ.startConsumer((err) => {
        if (err) {
          console.error('Failed to start consumer:', err);
          return;
        }

        console.log('✅ Consumer created and started in one call');

        // Set up message consumption
        consumer.consume(
          'quick-start-queue-manager',
          (message: any, done: () => void) => {
            console.log('📨 Received message:', message.getBody());
            done(); // Acknowledge message
          },
          (err: Error) => {
            if (err) {
              console.error('Failed to set up consumption:', err);
            } else {
              console.log(
                '✅ Consumer is now consuming messages from quick-start-queue-manager',
              );
            }
          },
        );
      });
    });
  },
);
```
