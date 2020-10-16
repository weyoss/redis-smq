'use strict';

module.exports = function PowerStateManager() {
    const states = {
        UP: 1,
        DOWN: 0
    };
    let state = states.DOWN;
    let stateTransition = false;

    /**
     * @return {boolean}
     */
    function switchState(s) {
        if (stateTransition) {
            throw new Error('Can not switch state while another state transition is in progress.');
        }
        if (s === state) {
            throw new Error('Can not switch to the same current state.');
        }
        stateTransition = true;
    }

    return {
        /**
         * @return {boolean}
         */
        isUp() {
            return state === states.UP;
        },

        /**
         * @return {boolean}
         */
        isDown() {
            return state === states.DOWN;
        },

        /**
         * @return {boolean}
         */
        isGoingUp() {
            return this.isDown() && stateTransition;
        },

        /**
         * @return {boolean}
         */
        isGoingDown() {
            return this.isUp() && stateTransition;
        },

        /**
         *
         * @return {boolean}
         */
        isRunning() {
            return this.isUp() && !stateTransition;
        },

        goingUp() {
            switchState(states.UP);
        },

        up() {
            stateTransition = false;
            state = states.UP;
        },

        goingDown() {
            switchState(states.DOWN);
        },

        down() {
            stateTransition = false;
            state = states.DOWN;
        }
    };
};
