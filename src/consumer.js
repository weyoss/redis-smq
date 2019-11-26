'use strict';

const Instance = require('./instance');


class Consumer extends Instance {
    /**
     * See docs.
     *
     * @param {object} config
     * @param {object} options
     */
    constructor(config = {}, options = {}) {
        super();
        this.dispatcher.bootstrapConsumer(this, config, options);
    }

    /**
     *
     * @param {*} message
     * @param {function} cb
     */
    consume(message, cb) {
        /* eslint class-methods-use-this: 0 */
        throw new Error('Consume method should be extended');
    }
}

module.exports = Consumer;
