import { IRedisSMQConfig, IEventListenersConfigRequired } from '../../../types';
import { merge } from 'lodash';

const defaultConfig: IEventListenersConfigRequired = {
  consumerEventListeners: [],
  producerEventListeners: [],
};

export function EventListeners(
  userConfig: IRedisSMQConfig,
): IEventListenersConfigRequired {
  const { eventListeners = {} } = userConfig;
  return merge({}, defaultConfig, eventListeners);
}
