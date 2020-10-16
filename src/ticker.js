'use strict';

module.exports = function Ticker(onTick, time) {
    let timer = null;
    let interval = null;
    let shutdownFn = null;
    return {
        shutdown(fn) {
            shutdownFn = fn;
            if (timer) {
                clearTimeout(timer);
                shutdownFn();
            }
            if (interval) {
                clearInterval(interval);
                shutdownFn();
            }
        },
        nextTick() {
            if (shutdownFn) shutdownFn();
            else {
                timer = setTimeout(onTick, time);
            }
        },
        autoRun() {
            interval = setInterval(() => {
                if (shutdownFn) {
                    clearInterval(interval);
                    shutdownFn();
                } else onTick();
            }, time);
        }
    };
};
