import {CallbackType} from "./misc";
import {InstanceInterface} from "./instance";
import {ConfigInterface} from "./config";
import {MessageInterface} from "./message";

export interface ProducerConstructorInterface {
    new (queueName: string, config?: ConfigInterface): ProducerInterface,
}

export interface ProducerInterface extends InstanceInterface {
    produceMessage(msg: MessageInterface, cb: CallbackType):void,
}
