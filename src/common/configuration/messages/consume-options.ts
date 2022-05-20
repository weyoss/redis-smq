import { IConfig, IMessagesConfig } from '../../../../types';
import { merge } from 'lodash';

const defaultConfig: Required<IMessagesConfig['consumeOptions']> = {
  consumeTimeout: 0,
  retryThreshold: 3,
  retryDelay: 60000,
  ttl: 0,
};

export default function ConsumeOptions(
  userConfig: IConfig,
): Required<IMessagesConfig['consumeOptions']> {
  return merge({}, defaultConfig, userConfig.messages?.consumeOptions ?? {});
}
