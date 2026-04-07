/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { config } from '../../../tests/common/config.js';
import { TResponse } from '../../../tests/types/index.js';
import { UpdateConfigurationControllerResponseDTO } from './UpdateConfigurationControllerResponseDTO.js';
import { ConfigManager } from 'redis-smq';

describe('updateConfigurationController', () => {
  it('HTTP 200 OK', async () => {
    const request = supertest(`http://127.0.0.1:${config.apiServer?.port}`);
    const response1: TResponse<UpdateConfigurationControllerResponseDTO> =
      await request.patch('/api/config').send({
        messageAudit: true,
      });
    expect(response1.status).toEqual(200);

    const cfgManager = new ConfigManager();
    const cfg = cfgManager.getConfig();

    expect(response1.body?.data).toEqual(cfg);
    expect(
      response1.body?.data?.messageAudit.acknowledgedMessages.enabled,
    ).toEqual(true);
    expect(
      response1.body?.data?.messageAudit.deadLetteredMessages.enabled,
    ).toEqual(true);
    expect(
      response1.body?.data?.messageAudit.unacknowledgementHistory.enabled,
    ).toEqual(true);
  });
});
