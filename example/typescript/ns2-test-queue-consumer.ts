import { config } from "./config";
import RedisSMQ from "../../index";
import {CallbackType} from "../../types/misc";
import {MessageInterface} from "../../types/message";


class Ns2TestQueueConsumer extends RedisSMQ.Consumer {

    // Don't forget to set the queue name
    static queueName: string = 'test_queue';

    /**
     *
     * @param message
     * @param cb
     */
    consume(message: MessageInterface, cb: CallbackType) {
        /* eslint class-methods-use-this: 0 */
        //  console.log(`Got message to consume: `, JSON.stringify(message));
        //  throw new Error('TEST!');
        //  cb(new Error('TEST!'));
        //  const timeout = parseInt(Math.random() * 100);
        //  setTimeout(() => {
        //      cb();
        //  }, timeout);
        cb();
    }
}

//
const newConfig = { ...config, namespace: 'ns2' };
const consumer = new Ns2TestQueueConsumer(newConfig, { messageConsumeTimeout: 2000 });
consumer.run();

/*
setTimeout(() => {
    consumer.shutdown();
}, 2000);
*/
