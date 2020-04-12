import { config } from "./config";
import RedisSMQ from "../../index";


const producer = new RedisSMQ.Producer('test_queue', config);

/*
function produceNTimes(payload, n, cb) {
    n -= 1;
    if (true) {
        const message = new Message();
        message.setBody(payload);
        producer.produceMessage(message, (err) => {
            if (err) cb(err);
            else produceNTimes(payload, n, cb);
        });
    } else cb();
}

produceNTimes({ hello: 'world' }, 1000000, (err) => {
    if (err) throw err;
    else {
        console.log('Produced successfully!');
        producer.shutdown();
    }
});
*/

const msg = new RedisSMQ.Message();
msg.setBody({ hello: 123 });

producer.produceMessage(msg, (err) => {
    if (err) throw err;
    else producer.shutdown();
});
