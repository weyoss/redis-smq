'use strict';

const path = require('path');
const sinon = require('sinon');
const { Consumer, Producer } = require('../../index');
const redisClient = require('../../src/redis-client.js');


const config = {
    namespace: 'testing',
    redis: {
        driver: 'ioredis'
    },
    monitor: {
        enabled: true,
        host: '127.0.0.1',
        port: 3000,
    },
};
const consumersList = [];
const producersList = [];
let redisClientInstance = null;

function clean(set, cb) {
    if (set.length) {
        let item = set.pop();
        const onStopped = () => {
            item = null;
            clean(set, cb);
        };
        if (item.stop) {
            if (item.isRunning()) {
                item.on('down', onStopped);
                item.stop();
            } else onStopped();
        } else {
            item.shutdown();
            onStopped();
        }
    } else cb();
}

function getConsumer(queueName = 'test_queue', options = {}) {
    const TemplateClass = class extends Consumer {
        consume(message, cb) {
            cb();
        }
    };
    TemplateClass.queueName = queueName;
    const consumer = new TemplateClass(config, options);
    consumersList.push(consumer);
    return consumer;
}

function getProducer(queueName = 'test_queue') {
    const producer = new Producer(queueName, config);
    producersList.push(producer);
    return producer;
}

function validateTime(actualTime, expectedTime, driftTolerance = 3000) {
    return (actualTime >= expectedTime - driftTolerance) && (actualTime <= expectedTime + driftTolerance);
}

before(function (done) {
    this.timeout(160000);
    const proceed = () => {
        this.sandbox = sinon.sandbox.create();
        this.sandbox.getConsumer = getConsumer;
        this.sandbox.getProducer = getProducer;
        this.sandbox.validateTime = validateTime;
        done();
    }
    if (!redisClientInstance) {
        redisClient.getNewInstance(config, (c) => {
            redisClientInstance = c;
            proceed();
        });
    } else proceed();
});

beforeEach(function (done) {
    this.sandbox.restore();
    redisClientInstance.flushall((err) => {
        if (err) throw err;
        done();
    });
});

afterEach(function (done) {
    this.timeout(160000);
    clean(consumersList, () => {
        clean(producersList, done);
    });
});

after(function (done) {
    redisClientInstance.end(true);
    done();
});