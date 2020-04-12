'use strict';

const { EventEmitter } = require('events');
const dispatcher = require('./dispatcher');


class Instance extends EventEmitter {
    /**
     * See docs.
     */
    constructor() {
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
     *
     * @returns {boolean}
     */
    isRunning() {
        return this.dispatcher.isRunning();
    }
}

module.exports = Instance;
