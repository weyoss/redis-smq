[RedisSMQ](../README.md) / [Docs](README.md) / Exchanges and Delivery Models

# Exchanges and Delivery Models

![RedisSMQ Exchanges and Delivery Models](redis-smq-exchanges-and-delivery-models.png)

[Message Exchanges](message-exchanges.md) should not be confused with [Queue Delivery Models](queue-delivery-models.md).

Message exchanges allow publishing a message to one or many queues based on the message exchange. 

On the other hand, delivery models allow delivering a message to one consumer or to all consumers of a given queue.

Message exchanges and queue delivery models can be combined in order to create, as shown in the diagram above, complex publishing/delivering models based on various criteria that may be defined depending on your application needs.
