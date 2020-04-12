import { config } from "./config";
import RedisSMQ from "../../";

RedisSMQ.monitor(config).listen(() => {
    console.log('It works!');
});
