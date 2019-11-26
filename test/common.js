'use strict';

const bluebird = require('bluebird');
const { Consumer, Producer } = require('../index');
const redisClient = require('../src/redis-client.js');
const config = require('./config');

const consumersList = [];
const producersList = [];

async function shutdown() {
    const p = async (list) => {
        for (const i of list) {
            if (i.isRunning()) {
                // eslint-disable-next-line no-await-in-loop
                await new Promise((resolve, reject) => {
                    i.shutdown();
                    i.on('down', resolve);
                    i.on('error', reject);
                });
            }
        }
    };
    await p(consumersList);
    await p(producersList);
}

function getConsumer(queueName = 'test_queue', options = {}) {
    const TemplateClass = class extends Consumer {
        // eslint-disable-next-line class-methods-use-this
        consume(message, cb) {
            cb();
        }
    };
    TemplateClass.queueName = queueName;
    let consumer = new TemplateClass(config, options);
    consumer = bluebird.promisifyAll(consumer);
    consumersList.push(consumer);
    return consumer;
}

function getProducer(queueName = 'test_queue') {
    let producer = new Producer(queueName, config);
    producer = bluebird.promisifyAll(producer);
    producersList.push(producer);
    return producer;
}

function validateTime(actualTime, expectedTime, driftTolerance = 3000) {
    return (actualTime >= expectedTime - driftTolerance) && (actualTime <= expectedTime + driftTolerance);
}

async function getRedisInstance() {
    const c = await new Promise((resolve, reject) => {
        redisClient.getNewInstance(config, (i, err) => {
            if (err) reject(err);
            else resolve(i);
        });
    });
    return bluebird.promisifyAll(c);
}

async function consumerOnEvent(consumer, event, cb) {
    return new Promise((resolve, reject) => {
        consumer.once(event, () => {
            cb();
            resolve();
        });
    });
}

async function onConsumerIdle(consumer, cb) {
    return consumerOnEvent(consumer, 'idle', cb);
}

async function onConsumerUp(consumer, cb) {
    return consumerOnEvent(consumer, 'up', cb);
}

async function onMessageConsumed(consumer, cb) {
    return consumerOnEvent(consumer, 'message.consumed', cb);
}

async function onMessageAcknowledged(consumer, cb) {
    return consumerOnEvent(consumer, 'message.consumed', cb);
}

async function onMessageDelayed(consumer, cb) {
    return consumerOnEvent(consumer, 'message.delayed', cb);
}

module.exports = {
    getProducer,
    getConsumer,
    shutdown,
    getRedisInstance,
    validateTime,
    onConsumerIdle,
    onConsumerUp,
    onMessageConsumed,
    onMessageDelayed,
};
