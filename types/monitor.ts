import {ConfigInterface} from "./config";
import {CallbackType} from "./misc";

export interface MonitorInterface {
    (config: ConfigInterface): {
        listen(cb: CallbackType): void
    }
}