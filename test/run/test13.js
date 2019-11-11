'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const Message = require('../../index').Message;

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 13: Produce and consume a delayed message with scheduledRepeat and scheduledPeriod parameters', function() {

    it('Case 1: is OK', function (done) {
        this.timeout(160000);
        const producer = this.sandbox.getProducer();
        const consumer = this.sandbox.getConsumer();
        const validateTime = this.sandbox.validateTime;
        const timeArray = [];
        let createdAt = null;
        let callCount = 0;
        let runCheck = true;

        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            const diff = Date.now() - createdAt;
            timeArray.push(diff);
            cb();

            callCount += 1;
            if (runCheck) {
                runCheck = false;
                check();
            }
        });

        const check = (n = 5) => {
            n -= 1;
            if (n) {
                setTimeout(() => {
                    if (callCount > 3) throw new Error('Unexpected call');
                    else check(n);
                }, 3000);
            } else {
                expect(timeArray.length === 3).to.be.true;
                expect(validateTime(timeArray[0], 10000)).to.be.true;
                expect(validateTime(timeArray[1], 13000)).to.be.true;
                expect(validateTime(timeArray[2], 16000)).to.be.true;
                done();
            }
        };

        consumer.run();

        const msg = new Message();
        msg
            .setScheduledDelay(10)
            .setScheduledRepeat(3)
            .setScheduledPeriod(3)
            .setBody({ hello: 'world' });

        createdAt = msg.getCreatedAt();
        producer.produceMessage(msg, (err) => {
            if (err) throw err;
        });
    });


    it('Case 2: is OK', function (done) {
        this.timeout(160000);
        const producer = this.sandbox.getProducer();
        const consumer = this.sandbox.getConsumer();
        const validateTime = this.sandbox.validateTime;

        const timeArray = [];
        let createdAt = null;
        let callCount = 0;
        let runCheck = true;

        this.sandbox.stub(consumer, 'consume', (msg, cb) => {
            const diff = Date.now() - createdAt;
            timeArray.push(diff);
            cb();

            callCount += 1;
            if (runCheck) {
                runCheck = false;
                check();
            }
        });

        const check = (n = 5) => {
            n -= 1;
            if (n) {
                setTimeout(() => {
                    if (callCount > 1) throw new Error('Unexpected call');
                    else check(n);
                }, 3000);
            } else {
                expect(timeArray.length === 1).to.be.true;
                expect(validateTime(timeArray[0], 10000)).to.be.true;
                done();
            }
        };

        consumer.run();

        const msg = new Message();
        msg
            .setScheduledDelay(10)
            .setScheduledRepeat(0) // should not be repeated
            .setScheduledPeriod(3)
            .setBody({ hello: 'world' });

        createdAt = msg.getCreatedAt();
        producer.produceMessage(msg, (err) => {
            if (err) throw err;
        });
    });

});
