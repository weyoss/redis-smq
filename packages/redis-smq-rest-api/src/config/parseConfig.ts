/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { URL } from 'url';
import { constants } from './constants.js';
import { ConfigInvalidApiServerParamsError } from './errors/ConfigInvalidApiServerParamsError.js';
import {
  IRedisSMQHttpApiConfig,
  IRedisSMQHttpApiParsedConfig,
  THttpApiConfig,
} from './types/index.js';

function normalizePath(path: string) {
  const s = path
    .split('/')
    .map((i) => i.trim())
    .filter((i) => !!i)
    .join('/');
  return `/${s}`;
}

function validateURL(
  apiServer: THttpApiConfig,
): [string, number, string] | Error {
  const {
    hostname = constants.apiServerHostname,
    port = constants.apiServerPort,
    basePath = constants.apiServerBasePath,
  } = apiServer;
  const address = `http://${hostname}:${port}${normalizePath(basePath)}`;
  try {
    const url = new URL(address);
    if (!['http'].map((x) => `${x.toLowerCase()}:`).includes(url.protocol)) {
      return new ConfigInvalidApiServerParamsError();
    }
    if (hostname !== url.hostname || port !== Number(url.port)) {
      return new ConfigInvalidApiServerParamsError();
    }
    return [url.hostname, Number(url.port), url.pathname];
  } catch {
    return new ConfigInvalidApiServerParamsError();
  }
}

export function parseConfig(
  config: IRedisSMQHttpApiConfig = {},
): IRedisSMQHttpApiParsedConfig {
  const { apiServer = {}, ...rest } = config;
  const reply = validateURL(apiServer);
  if (reply instanceof Error) throw reply;
  const [hostname, port, basePath] = reply;
  return {
    ...rest,
    apiServer: {
      hostname,
      port,
      basePath,
    },
  };
}
