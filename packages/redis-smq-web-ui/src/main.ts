/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */
import './styles/main.css';

import { createApp } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import router from '@/router';
import App from './App.vue';

createApp(App)
  .use(router)
  .use(VueQueryPlugin, {
    queryClientConfig: {
      defaultOptions: {
        queries: { refetchOnWindowFocus: false, retry: 1 },
      },
    },
  })
  .mount('#app');
