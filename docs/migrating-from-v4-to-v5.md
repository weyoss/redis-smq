# Migrating from RedisSMQ v4.x.x to v5.x.x

If you are coming from a version older than v5, you should consider the following notes before upgrading.

RedisSMQ v5 has brought message management features to the Web UI.

Many internal data structures of the MQ has been refactored to use `LIFO` queues. Therefore, before upgrading, 
if your have any important data (messages) existing in the MQ, you should first make a backup or finish your data 
processing.

To avoid conflicts and to prevent data lost, the Redis keys "version" has been bumped up. So your existing 
data would not be touched.

Finally, HTTP API endpoints has been also updated. Please referer to [HTTP API Reference](/docs/http-api.md) for more details.
