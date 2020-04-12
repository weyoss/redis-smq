// Type definitions for redis-smq 2
// Project: https://github.com/weyoss/redis-smq
// Definitions by: Weyoss <https://github.com/weyoss>

import {MonitorInterface} from "./types/monitor";
import {ConsumerConstructorInterface} from "./types/consumer";
import {MessageConstructorInterface} from "./types/message";
import {ProducerConstructorInterface} from "./types/producer";

export interface RedisSMQInterface {
    Message: MessageConstructorInterface,
    Consumer: ConsumerConstructorInterface,
    Producer: ProducerConstructorInterface,
    monitor: MonitorInterface
}

declare const RedisSMQ: RedisSMQInterface;

export default RedisSMQ;

