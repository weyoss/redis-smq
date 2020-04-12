import {InstanceInterface} from "./instance";
import {ConfigInterface} from "./config";
import {CallbackType} from "./misc";

export interface ConsumerConstructorOptionsInterface {
    messageConsumeTimeout?: number,
    messageTTL?: number,
    messageRetryThreshold?: number,
    messageRetryDelay?: number,
}

export interface ConsumerConstructorInterface {
    new (config: ConfigInterface, options?: ConsumerConstructorOptionsInterface) : ConsumerInterface,
    queueName: string,
}

export interface ConsumerInterface extends InstanceInterface {
    consume(message: any, cb: CallbackType): void
}
