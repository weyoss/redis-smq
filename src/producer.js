'use strict';

const EventEmitter = require('events').EventEmitter;
const uuid = require('uuid/v4');
const dispatcher = require('./dispatcher');
const Message = require('./message');


class Producer extends EventEmitter {
    /**
     * See docs.
     *
     * @param {string} queueName
     * @param {object} config
     */
    constructor(queueName, config = {}) {
        super();
        this.dispatcher = dispatcher();
        this.dispatcher.bootstrapProducer(this, config, queueName);
        this.dispatcher.run();
    }

    /**
     *
     * @param msg
     * @param cb
     */
    produceMessage(msg, cb) {
        /* eslint class-methods-use-this : 0 */
        this.dispatcher.produce(msg, cb);
    }

    /**
     * @deprecated use produceMessage() instead.
     * @param payload
     * @param cb
     */
    produce(payload, cb) {
        const msg = new Message();
        msg.setBody(payload);
        this.produceMessage(msg, cb);
    }

    /**
     *
     * @deprecated use produceMessage() instead
     * @param payload
     * @param ttl
     * @param cb
     */
    produceWithTTL(payload, ttl, cb) {
        const msg = new Message();
        msg.setBody(payload).setTTL(ttl);
        this.produceMessage(msg, cb);
    }

    /**
     *
     */
    shutdown() {
        /* eslint class-methods-use-this : 0 */
        this.dispatcher.shutdown();
    }
}


module.exports = Producer;
