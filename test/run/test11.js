'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 11: A message is delivered only once to one consumer', function() {

    it('is OK', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.producer;

        // First consumer

        const consumer = this.sandbox.getConsumer();
        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            cb();
        });
        let reQueuedCount1 = 0;
        let consumedCount1 = 0;
        let idle1 = false;
        consumer
            .on('message.requeued', () => {
                reQueuedCount1 += 1;
            })
            .on('message.consumed', () => {
                consumedCount1 += 1;
            })
            .once('idle', () => {
                idle1 = true;
            });
        consumer.run();

        // Second consumer

        const anotherConsumer = this.sandbox.getConsumer();
        this.sandbox.stub(anotherConsumer, 'consume', (msg, cb) => {
            cb();
        });
        let reQueuedCount2 = 0;
        let consumedCount2 = 0;
        let idle2 = false;
        anotherConsumer
            .on('message.requeued', () => {
                reQueuedCount2 += 1;
            })
            .on('message.consumed', () => {
                consumedCount2 += 1;
            })
            .once('idle', () => {
                idle2 = true;
            });
        anotherConsumer.run();

        const check = () => {
            if (idle1 && idle1) {
                expect(reQueuedCount1).to.eq(0);
                expect(reQueuedCount2).to.eq(0);
                if (consumedCount1) {
                    expect(consumedCount1).to.eq(1);
                    expect(consumedCount2).to.eq(0);
                } else {
                    expect(consumedCount1).to.eq(0);
                    expect(consumedCount2).to.eq(1);
                }
                done();
            } else {
                setTimeout(() => {
                    check();
                }, 2000);
            }
        };

        producer.produce({ hello: 'world' }, (err) => {
            if (err) throw err;
            else check();
        });
    });

});
