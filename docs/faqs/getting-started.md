[RedisSMQ](../README.md) / [Docs](README.md) / [FAQs](README.md) / What is the recommended way to set up and configure RedisSMQ for a new project?

# What is the recommended way to set up and configure RedisSMQ for a new project?

1. Prerequisites
   - **Redis**: Ensure you have Redis >=4 installed and running on your system or an accessible server.
   - **Node.js**: Make sure you have Node.js >= v18 installed on your system.

2. Install RedisSMQ

   First, install the package using npm:

   ```bash
   npm install redis-smq@rc
   ```
   
3. Create a configuration file:
   
   Create a new file, for example, `redis-smq-config.js`, and add the following basic configuration:

   **File: /path/to/your/project/redis-smq-config.js**
   ```javascript
   import { ERedisConfigClient } from 'redis-smq-common';

   export const config = {
     namespace: 'my_project',
     redis: {
       client: ERedisConfigClient.IOREDIS,
       options: {
         host: '127.0.0.1',
         port: 6379,
       },
     },
     logger: {
       enabled: true,
       options: {
         level: 'info',
       },
     },
   };
   ```

4. Create a queue

   **File: /path/to/your/project/queue.js**
   ```javascript 
   import { Queue, Configuration } from 'redis-smq';
   import config from './path/to/your/project/redis-smq-config.js';
   
   Configuration.getSetConfig(config);

   // Initialize Queue
   const queue = new Queue();
   
   // Save Queue Configuration
   queue.save('my_queue', EQueueType.LIFO_QUEUE, EQueueDeliveryModel.POINT_TO_POINT, (err, reply) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log('Queue created.', reply);
      queue.shutdown((err) => {
        console.log('Queue shut down');
      });
   });
   ```

5. Create a producer

   Create a file for your producer, e.g., `producer.js`:

   **File: /path/to/your/project/producer.js**
   ```javascript
   import { Producer, ProducibleMessage, Configuration } from 'redis-smq';
   import config from './path/to/your/project/redis-smq-config.js';

   Configuration.getSetConfig(config);
   
   const producer = new Producer();

   producer.run((err) => {
      if (err) {
        console.error('Failed to start producer:', err);
        return;
      }

      const message = new ProducibleMessage();
      message.setBody({ hello: 'world' }).setQueue('my_queue');
   
      producer.produce(message, (err, messageIds) => {
          if (err) {
            console.error('Failed to produce message:', err);
            return;
          }
          console.log(`Produced message IDs are: ${messageIds.join(', ')}`);
          producer.shutdown((err) => {
            if (err)  console.error('Failed to shutdown producer:', err);
            else console.log('Producer shut down.');
          });
      });
   });
   ```

6. Create a consumer

   Create a file for your consumer, e.g., `consumer.js`:

   **File: /path/to/your/project/consumer.js**
   ```javascript
   import { Consumer, Configuration } from 'redis-smq';
   import config from './path/to/your/project/redis-smq-config.js';

   Configuration.getSetConfig(config);
   
   const consumer = new Consumer();

   const messageHandler = (msg, cb) => {
      console.log(msg.body);
      cb(); // Acknowledging
   };

   consumer.consume('my_queue', messageHandler, (err) => {
     if (err) console.error('Failed to start consuming:', err);
     else console.log('Message handler successfully registered for queue: my_queue');
   });

   consumer.run((err) => {
     if (err) console.error('Failed to start consumer:', err);
     else console.log('Consumer is running.');
   });
   ```

7. Run your application

   You can now run your producer and consumer in separate terminal windows:

   ```bash
   node path/to/your/project/queue.js
   node path/to/your/project/producer.js
   node path/to/your/project/consumer.js
   ```

This setup provides a basic configuration for RedisSMQ in a new project.

For more advanced configurations and features, refer to the documentation in the `docs` directory of the RedisSMQ 
project. This includes information on different exchange types, delivery models, and other advanced features that 
you might want to incorporate as your project grows.