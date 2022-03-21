import { IConfig, IRequiredConfig } from '../../../../types';
import { merge } from 'lodash';

const defaultConfig: IRequiredConfig['logger'] = {
  enabled: false,
};

export default function Logger(userConfig: IConfig): IRequiredConfig['logger'] {
  return merge({}, defaultConfig, userConfig.logger ?? {});
}
