'use strict';

const sinon = require('sinon');
const config = require('../common/config');
const redisSMQ = require('../../index');
const redisClient = require('./../../src/redis-client');

const Consumer = redisSMQ.Consumer;
const Producer = redisSMQ.Producer;

const client = redisClient.getNewInstance(config);
const consumersList = [];
const producersList = [];

function clean(set, cb) {
    if (set.length) {
        let item = set.pop();
        const onStopped = () => {
            item = null;
            clean(set, cb);
        };
        if (item.stop) {
            if (item.isRunning()) {
                item.on('halt', onStopped);
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

before(function (done) {
    this.sandbox = sinon.sandbox.create();
    this.sandbox.getConsumer = getConsumer;
    this.sandbox.getProducer = getProducer;
    done();
});

after(function (done) {
    client.end(true);
    done();
});

beforeEach(function (done) {
    this.sandbox.restore();
    client.flushall((err) => {
        if (err) throw err;
        done();
    });
});

afterEach(function (done) {
    this.timeout(40000);
    clean(consumersList, () => {
        clean(producersList, done);
    });
});
