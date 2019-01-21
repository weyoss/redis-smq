'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 2: Produce and consume 1 message', function() {

    it('is OK', function (done) {
        this.timeout(20000);
        const producer = this.sandbox.getProducer();
        const consumer = this.sandbox.getConsumer();
        const consume = this.sandbox.spy(consumer, 'consume');
        consumer.once('idle', () => {
            expect(consume).to.have.been.calledWith({ hello: 'world' }).callCount(1);
            done();
        });
        producer.produce({ hello: 'world' }, (err) => {
            if (err) throw err;
            consumer.run();
        });
    });

});
