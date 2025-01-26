[RedisSMQ](../README.md) / [Docs](README.md) / Queue Rate Limiting

# Queue Rate Limiting

In certain scenarios, consuming messages at a high rate can be disadvantageous. Some potential issues include:

- **System Performance:** A high rate of message consumption may overwhelm your application, leading to performance degradation.
- **Resource Utilization:** Rapid message consumption can result in excessive resource usage, negatively impacting the overall performance of your system.
- **External API Restrictions:** If your application interacts with an external API that enforces rate limits on client requests, consuming messages too quickly could risk the suspension or permanent ban of your service.
- **Additional Considerations:** Various other factors may necessitate managing message consumption rates.

To address these challenges, RedisSMQ allows you to set and control the rate at which messages are consumed by 
implementing a rate limit for a queue.

### Example

Here's a simple example of how to set up a rate limit for your queue:

```javascript
const { QueueRateLimit } = require('redis-smq');

const queueRateLimit = new QueueRateLimit();

// Setting a rate limit of 200 messages per minute for the 'notifications' queue
queueRateLimit.set('notifications', { limit: 200, interval: 60000 }, (err) => {
  if (err) {
    console.error('Error setting rate limit:', err);
  } else {
    console.log('Rate limit set successfully!');
  }
});
```

For comprehensive guidance on configuring and managing rate limiting for a queue, refer to the following resource:

- [QueueRateLimit Class Documentation](api/classes/QueueRateLimit.md)

Additionally, you can configure queue rate limiting parameters using the [HTTP API Interface](https://github.com/weyoss/redis-smq-monitor) or by accessing the [Web UI](https://github.com/weyoss/redis-smq-monitor-client) from your browser.