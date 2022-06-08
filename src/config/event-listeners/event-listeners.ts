import { IConfig, TRequiredEventListenersConfig } from '../../../types';
import { merge } from 'lodash';

const defaultConfig: TRequiredEventListenersConfig = {
  consumerEventListeners: [],
  producerEventListeners: [],
};

export function EventListeners(
  userConfig: IConfig,
): TRequiredEventListenersConfig {
  const { eventListeners = {} } = userConfig;
  return merge({}, defaultConfig, eventListeners);
}
