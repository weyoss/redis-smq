/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export default {
  redisSMQApi: {
    input: {
      target: 'node_modules/redis-smq-rest-api/dist/openapi-specs.json',
    },
    output: {
      httpClient: 'axios',
      mode: 'tags-split',
      target: './src/api/generated',
      schemas: './src/api/model',
      client: 'vue-query',
      prettier: true,
      override: {
        mutator: {
          path: './src/api/axios-client.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
        queryOptions: {
          staleTime: 10000,
        },
        mutationOptions: {
          retry: 1,
        },
        operations: {
          // You can override specific operations if needed
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
};
