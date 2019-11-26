'use strict';

const { EventEmitter } = require('events');
const dispatcher = require('./dispatcher');


class Instance extends EventEmitter {
    /**
     * See docs.
     *
     * @param {object} config
     * @param {object} options
     */
    constructor(config = {}, options = {}) {
        super();
        this.dispatcher = dispatcher();
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
    shutdown() {
        this.dispatcher.shutdown();
    }

    /**
     * @deprecated use shutdown() instead.
     */
    stop() {
        this.shutdown();
    }

    /**
     *
     * @returns {boolean}
     */
    isRunning() {
        return this.dispatcher.isRunning();
    }
}

module.exports = Instance;
