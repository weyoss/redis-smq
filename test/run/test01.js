'use strict';

const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.use(sinonChai);

describe('Test 1: A consumer does not a consume a message when no messages are produced', function() {

    it('is OK', function (done) {
        this.timeout(20000);
        const consumer = this.sandbox.getConsumer();
        const consume = this.sandbox.spy(consumer, 'consume');
        consumer.once('idle', () => {
            expect(consume).to.have.been.callCount(0);
            done();
        });
        consumer.run();
    });
});
