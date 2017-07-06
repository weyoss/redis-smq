# RedisSMQ Monitor screenshots

Please note that the numbers shown in the screenshots are related to the Redis server configuration and the performance 
parameters of the host the server is running on!

## Consumers rates

RedisSMQ running 2 queues with 30 consumers (15 consumers/queue) while simultaneously 7 producers are producing messages in both queues:

![RedisSMQ Monitor](./img_1.png)

RedisSMQ running 2 queues with 30 consumers (15 consumers/queue), without producers:

![RedisSMQ Monitor](./img_5.png)

## Producers rates

RedisSMQ running 2 queues with 30 consumers (15 consumers/queue) while simultaneously 7 producers are producing messages in both queues:

![RedisSMQ Monitor](./img_2.png)

RedisSMQ running 7 producers, without consumers:

![RedisSMQ Monitor](./img_4.png)

## Online consumers

Online consumers with theirs resources usage:

![RedisSMQ Monitor](./img_3.png)
