'use strict';

const EventEmitter = require('events').EventEmitter;
const dispatcher = require('./dispatcher');


class Consumer extends EventEmitter {
    /**
     * See docs.
     *
     * @param {object} config
     * @param {object} options
     */
    constructor(config = {}, options = {}) {
        super();
        this.dispatcher = dispatcher();
        this.dispatcher.bootstrapConsumer(this, config, options);
    }

    /**
     *
     */
    run() {
        this.dispatcher.run();
    }

    /**
     *
     */
    stop() {
        this.dispatcher.shutdown();
    }

    /**
     *
     * @returns {boolean}
     */
    isRunning() {
        return this.dispatcher.isRunning();
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
