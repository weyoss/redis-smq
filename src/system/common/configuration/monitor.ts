import { IConfig, IRequiredMonitorConfig } from '../../../../types';
import { merge } from 'lodash';
import { ConfigurationError } from './configuration.error';

const defaultConfig: IRequiredMonitorConfig = {
  enabled: false,
  basePath: '/',
};

export default function Monitor(
  userConfig: IConfig = {},
): IRequiredMonitorConfig {
  const monitorConfig: IRequiredMonitorConfig = merge(
    {},
    defaultConfig,
    userConfig.monitor ?? {},
  );
  const { basePath } = monitorConfig;
  let normalizedBasePath = basePath;
  if (normalizedBasePath !== '/') {
    normalizedBasePath = normalizedBasePath.replace(/\/+$/, '');
    if (!/^(\/[0-9a-zA-Z\-_]+)+$/.test(normalizedBasePath)) {
      throw new ConfigurationError('Invalid [monitor.basePath] value');
    }
    // Trailing slash is required to make <base /> tag work properly
    normalizedBasePath = `${normalizedBasePath}/`;
  }
  monitorConfig.basePath = normalizedBasePath;
  return monitorConfig;
}
