'use strict';

const sinon = require('sinon');
const config = require('../common/config');
const redisSMQ = require('../../index');
const redisClient = require('./../../src/redis-client');
const TestQueueConsumer = require('./../common/consumers/test-queue-consumer');

const Producer = redisSMQ.Producer;
const producer = new Producer('test_queue', config);
const client = redisClient.getNewInstance(config);

const consumersList = [];

function cleanConsumers(cb) {
    let consumer = consumersList.pop();
    if (consumer) {
        consumer.removeAllListeners('idle');
        consumer.removeAllListeners('message_requeued');
        consumer.removeAllListeners('message_consumed');
        consumer.removeAllListeners('message_dead_queue');
        consumer.removeAllListeners('halt');
        const onStopped = () => {
            consumer = null;
            cleanConsumers(cb);
        };
        if (consumer.isRunning()) {
            consumer.on('halt', onStopped);
            consumer.stop();
        } else onStopped();
    } else cb();
}

function getConsumer(options) {
    const consumer = new TestQueueConsumer(config, options);
    consumersList.push(consumer);
    return consumer;
}

before(function (done) {
    this.sandbox = sinon.sandbox.create();
    this.sandbox.producer = producer;
    done();
});

beforeEach(function (done) {
    this.sandbox.restore();
    this.sandbox.getConsumer = getConsumer;
    client.flushall((err) => {
        if (err) throw err;
        done();
    });
});

afterEach(function (done) {
    this.timeout(20000);
    cleanConsumers(() => {
        done();
    });
});