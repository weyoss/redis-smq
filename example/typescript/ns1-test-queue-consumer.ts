import { config } from "./config";
import RedisSMQ from "../..";
import {CallbackType} from "../../types/misc";
import {MessageInterface} from "../../types/message";


class Ns1TestQueueConsumer extends RedisSMQ.Consumer {

    // Don't forget to set the queue name
    static queueName: string = 'test_queue';

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

const consumer = new Ns1TestQueueConsumer(config, { messageConsumeTimeout: 2000 });
consumer.run();

/*
setTimeout(() => {
    console.log('stopping');
    consumer.shutdown();
}, 5000);

setTimeout(() => {
    console.log('starting');
    consumer.run();
}, 30000);
*/

