/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import BaseModal from '@/components/ui/BaseModal.vue';

let wrapper: VueWrapper | null = null;

function mountModal(isVisible: boolean) {
  wrapper = mount(BaseModal, {
    props: { isVisible, title: 'Test Modal' },
    attachTo: document.body,
  });
  return wrapper;
}

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  document.body.innerHTML = '';
  delete document.body.dataset.modalCount;
  document.body.style.overflow = '';
});

describe('BaseModal', () => {
  it('does not render when isVisible is false', () => {
    mountModal(false);
    expect(document.querySelector('.rsmq-modal-scrim')).toBeNull();
  });

  it('renders when isVisible is true', async () => {
    const w = mountModal(true);
    await w.vm.$nextTick();
    expect(document.querySelector('.rsmq-modal-scrim')).not.toBeNull();
    expect(document.querySelector('.rsmq-modal__title')?.textContent).toBe(
      'Test Modal',
    );
  });

  it('locks body scroll while open', async () => {
    const w = mountModal(true);
    await w.vm.$nextTick();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('unlocks body scroll on close', async () => {
    const w = mountModal(true);
    await w.vm.$nextTick();
    await w.setProps({ isVisible: false });
    await w.vm.$nextTick();
    expect(document.body.style.overflow).toBe('');
  });

  it('emits close on Escape', async () => {
    const w = mountModal(true);
    await w.vm.$nextTick();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(w.emitted('close')).toBeTruthy();
  });

  it('emits close on scrim click', async () => {
    const w = mountModal(true);
    await w.vm.$nextTick();
    (document.querySelector('.rsmq-modal-scrim') as HTMLElement).click();
    expect(w.emitted('close')).toBeTruthy();
  });
});
