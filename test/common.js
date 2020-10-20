'use strict';

const bluebird = require('bluebird');
const { Consumer, Producer } = require('../index');
const redisClient = require('../src/redis-client.js');
const config = require('./config');
const events = require('../src/events');

const consumersList = [];
const producersList = [];

async function shutdown() {
    const p = async (list) => {
        for (const i of list) {
            if (i.powerStateManager.isRunning()) {
                // eslint-disable-next-line no-await-in-loop
                await new Promise((resolve, reject) => {
                    i.shutdown();
                    i.on(events.DOWN, resolve);
                    i.on(events.ERROR, reject);
                });
            }
        }
    };
    await p(consumersList);
    await p(producersList);
}

/**
 * @param {object} params
 * @param {string} params.queueName
 * @param {object} params.options
 * @param {function} params.consumeMock
 * @return {Consumer}
 */
function getConsumer({ queueName = 'test_queue', options = {}, consumeMock = null } = {}) {
    const TemplateClass = class extends Consumer {
        // eslint-disable-next-line class-methods-use-this
        consume(message, cb) {
            cb();
        }
    };
    TemplateClass.queueName = queueName;
    let consumer = new TemplateClass(config, options);
    if (consumeMock) {
        consumer.consume = consumeMock;
    }
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
    return actualTime >= expectedTime - driftTolerance && actualTime <= expectedTime + driftTolerance;
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

async function consumerOnEvent(consumer, event) {
    return new Promise((resolve, reject) => {
        consumer.once(event, () => {
            resolve();
        });
    });
}

async function untilConsumerIdle(consumer) {
    return consumerOnEvent(consumer, events.IDLE);
}

async function untilConsumerUp(consumer) {
    return consumerOnEvent(consumer, events.UP);
}

async function untilMessageAcknowledged(consumer) {
    return consumerOnEvent(consumer, events.MESSAGE_ACKNOWLEDGED);
}

async function untilMessageDelayed(consumer) {
    return consumerOnEvent(consumer, events.GC_MESSAGE_DELAYED);
}

async function untilConsumerEvent(consumer, event) {
    return consumerOnEvent(consumer, event);
}

module.exports = {
    getProducer,
    getConsumer,
    shutdown,
    getRedisInstance,
    validateTime,
    untilConsumerIdle,
    untilConsumerUp,
    untilMessageAcknowledged,
    untilMessageDelayed,
    untilConsumerEvent
};
