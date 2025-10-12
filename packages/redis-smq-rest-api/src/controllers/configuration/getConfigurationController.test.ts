/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { config } from '../../../tests/common/config.js';
import { TResponse } from '../../../tests/types/index.js';
import { GetConfigurationControllerResponseDTO } from '../../dto/controllers/configuration/GetConfigurationControllerResponseDTO.js';

describe('getConfigurationController', () => {
  it('HTTP 200 OK', async () => {
    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<GetConfigurationControllerResponseDTO> =
      await request.get('/api/v1/config');
    expect(response1.status).toEqual(200);
    expect(Object.keys(response1.body?.data ?? {}).sort()).toEqual(
      ['namespace', 'redis', 'logger', 'eventBus', 'messages'].sort(),
    );
  });
});
