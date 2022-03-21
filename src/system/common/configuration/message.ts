import { IConfig, TMessageDefaultOptions } from '../../../../types';
import { merge } from 'lodash';

const defaultConfig: TMessageDefaultOptions = {
  consumeTimeout: 0,
  retryThreshold: 3,
  retryDelay: 60000,
  ttl: 0,
};

export default function Message(userConfig: IConfig): TMessageDefaultOptions {
  return merge({}, defaultConfig, userConfig.message ?? {});
}
