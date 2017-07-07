'use strict';

const config = require('./config');
const TestQueueConsumer = require('./consumers/test-queue-consumer');

const consumer = new TestQueueConsumer(config, { messageConsumeTimeout: 2000 });
consumer.run();
