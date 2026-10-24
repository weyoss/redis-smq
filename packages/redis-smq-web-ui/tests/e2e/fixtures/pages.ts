/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, type Locator, type Page } from '@playwright/test';
import { SEL } from '../helpers/selectors.js';

export class QueueDetailPage {
  constructor(private readonly page: Page) {}

  async goto(queue: { ns: string; name: string }): Promise<void> {
    await this.page.goto(`/ns/${queue.ns}/queues/${queue.name}`);
    await expect(this.page.locator('h1')).toContainText(queue.name);
  }

  /** Clicks "Pause", fills the ChangeStateModal, submits. */
  async pause(
    opts: { reason?: string; description?: string } = {},
  ): Promise<void> {
    await this.page.getByRole('button', { name: 'Pause', exact: true }).click();
    await this.submitStateChangeModal('pause', opts);
  }

  async resume(
    opts: { reason?: string; description?: string } = {},
  ): Promise<void> {
    await this.page
      .getByRole('button', { name: 'Resume', exact: true })
      .click();
    await this.submitStateChangeModal('resume', opts);
  }

  async stop(
    opts: { reason?: string; description?: string } = {},
  ): Promise<void> {
    await this.page.getByRole('button', { name: 'Stop', exact: true }).click();
    await this.submitStateChangeModal('stop', opts);
  }

  async delete(): Promise<void> {
    await this.page
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    await this.confirmModal('Delete queue');
  }

  get banner(): Locator {
    return this.page.locator(SEL.stateBanner);
  }

  private async submitStateChangeModal(
    action: 'pause' | 'resume' | 'stop',
    opts: { reason?: string; description?: string },
  ): Promise<void> {
    const modal = this.page.locator(SEL.modal);
    await expect(modal).toBeVisible();
    if (opts.reason !== undefined) {
      await modal.locator('select').selectOption({ label: opts.reason });
    }
    if (opts.description !== undefined) {
      await modal.locator('textarea').fill(opts.description);
    }
    const label = {
      pause: 'Pause queue',
      resume: 'Resume queue',
      stop: 'Stop queue',
    }[action];
    await modal.getByRole('button', { name: label, exact: true }).click();
  }

  private async confirmModal(label: string): Promise<void> {
    const modal = this.page.locator(SEL.modal);
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: label, exact: true }).click();
  }
}
