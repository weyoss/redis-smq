'use strict';

const Instance = require('./instance');
const Message = require('./message');


class Producer extends Instance {
    /**
     * See docs.
     *
     * @param {string} queueName
     * @param {object} config
     */
    constructor(queueName, config = {}) {
        super();
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
        this.produceMessage(payload, cb);
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
}


module.exports = Producer;
