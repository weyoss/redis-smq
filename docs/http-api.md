# HTTP API

> ☝️ **Important Note**: The HTTP API is stable but many management features are missing. Currently, it is still a work in progress with frequent, maybe breaking, API changes.

This is the backend part of the [RedisSMQ Monitor](https://github.com/weyoss/redis-smq-monitor). 

In contrast to system/core functionalities and features, which use pure callbacks for asynchronous tasks, the monitor 
server has been implemented using async/await. 

The monitor server performs 3 tasks:

- Serving the SPA frontend application (UI).
- Providing "real-time" statistical data about various RedisSMQ metrics through WebSocket.
- Providing an HTTP API interface to interact with and manage the MQ.

## HTTP API

### Scheduler API

#### GET /api/scheduler/messages

List scheduled messages of a given queue.

##### Query parameters

* `queueName` (string): Required. Queue name 
* `skip` (number): Optional. Offset from where messages should be taken. Starts from 0. 
* `take` (number): Optional. Max number of messages that should be taken. Starts from 1.

##### Example

```text
curl -X GET http://localhost:3000/api/scheduler/messages?queueName=test&skip=10&take=25
```

#### DELETE /api/scheduler/messages

Delete a scheduled message in a given queue.

##### Query parameters

* `queueName` (string): Required. Queue name
* `id` (string): Required. Message ID

##### Example

```text
curl -X DELETE http://localhost:3000/api/scheduler/messages?queueName=test&id=5aa60522-a0c7-4cf4-8b0c-9fde0e22a1bd
```