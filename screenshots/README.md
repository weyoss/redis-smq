
# RedisSMQ Monitor screenshots

Please note that the numbers shown in the screenshots are related with Redis server configuration and host performance 
parameters on which the server is running!

## Redis-SMQ running 30 consumers (15 consumers per 2 queues) messages while other producers are producing messages in parallel:

![RedisSMQ Monitor](./img_1.png)

## 7 producers are producing messages while other consumers are consuming messages:
![RedisSMQ Monitor](./img_2.png)

## Online consumers with theirs resources usage:
![RedisSMQ Monitor](./img_3.png)

## 7 producers are producing messages without consumers:
![RedisSMQ Monitor](./img_4.png)

## 30 consumers (15 consumers per 2 queues) are consuming messages without running producers:
![RedisSMQ Monitor](./img_5.png)
