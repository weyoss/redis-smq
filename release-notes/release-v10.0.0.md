# RedisSMQ v10.0.0 Release Notes (2026-04-04)

## ✨ Features

- **redis-smq-ci:** add CI tools for RedisSMQ ([cdc2fbc](https://github.com/weyoss/redis-smq/commit/cdc2fbcd87ae2288fe5b69cd42605d93d66ea00e))
- **redis-smq-rest-api:** add endpoint for fetching message unack history ([440cc9c](https://github.com/weyoss/redis-smq/commit/440cc9cb760af4d9eed0c84fec7d2c3d86ac3ec1))
- **redis-smq-rest-api:** add pause/stop/resume queue API endpoints ([6580563](https://github.com/weyoss/redis-smq/commit/6580563f6ce4fe83692ff85288def884d10f702e))
- **redis-smq-rest-api:** add queue operational state module ([9016c0b](https://github.com/weyoss/redis-smq/commit/9016c0b3e46e68f22bf22dde84448f78def293d1))
- **redis-smq-web-ui:** add message failure history tracking ([fcf3973](https://github.com/weyoss/redis-smq/commit/fcf397361af38ec51de12524394c50371671c301))
- **redis-smq-web-ui:** add operational state history tracking ([40d6283](https://github.com/weyoss/redis-smq/commit/40d6283e05b0d6872acd346369d039236c839d46))
- **redis-smq-web-ui:** add queue operational state management ([d56eb97](https://github.com/weyoss/redis-smq/commit/d56eb970dc553d6a2d0ccfb20ecd08e4ae9df059))
- **redis-smq-web-ui:** support message unack history viewing ([772f7f1](https://github.com/weyoss/redis-smq/commit/772f7f107d811b3ba555adee99b22b6746c48172))
- **redis-smq:** add cross-instance configuration synchronization ([e5a1636](https://github.com/weyoss/redis-smq/commit/e5a16360821605689afc15d08da0f8a7f379476e))
- **redis-smq:** add dual callback and promise support to public API ([7fd23c7](https://github.com/weyoss/redis-smq/commit/7fd23c7b111846df8056d9a2830cdfb7332f2c9b))
- **redis-smq:** add message failure history tracking ([0fc4ef0](https://github.com/weyoss/redis-smq/commit/0fc4ef08b8ea08a38edc2b84c4821fe7c9b48b4b))
- **redis-smq:** add queue state management with pause/stop/resume functionality ([0f2f1d8](https://github.com/weyoss/redis-smq/commit/0f2f1d82ec8be7a96aa2cfb4704cc868fa8d7b22))
- **redis-smq:** enable retrieval of queue consumption status by consumer ([a7e1582](https://github.com/weyoss/redis-smq/commit/a7e1582b2ea301f9835f21b6f4537eea1cb728e9))
- **redis-smq:** implement batch message acks for improved performance ([4664e6a](https://github.com/weyoss/redis-smq/commit/4664e6a626e22eddbd6477f20dd93fcaba4ed5ab))
- **redis-smq:** implement batch unacks for improved performance ([973dd16](https://github.com/weyoss/redis-smq/commit/973dd16d0c851d89c563af8613b663f174fba616))
- **redis-smq:** introduce QueueOperationValidator, enhance Queue State Management ([aad3ead](https://github.com/weyoss/redis-smq/commit/aad3ead469267473d11d0f9641e5f4a617a081c3))
- **redis-smq:** support async/await message handlers ([761733a](https://github.com/weyoss/redis-smq/commit/761733ab686a7483a243b1d521ca990dddf03704))

## 🐛 Bug Fixes

- **redis-smq-common:** update IRedisClient.md reference ([d232393](https://github.com/weyoss/redis-smq/commit/d232393eb6a635cd94d68901b201bdc5449fbd63))
- **redis-smq-web-ui:** make 'total messages' header clickable ([2538b9d](https://github.com/weyoss/redis-smq/commit/2538b9dd1fb372c25f7e4c7dbdf6d3c9c6dadf23))
- **redis-smq-web-ui:** replace useInfiniteQuery with useQuery for better performance ([2c29fa4](https://github.com/weyoss/redis-smq/commit/2c29fa453a9bf9ee51e68395fe417e74c9530cf2))
- **redis-smq-web-ui:** update EMessagePropertyStatus to fix wrong message statuses ([5a19dc5](https://github.com/weyoss/redis-smq/commit/5a19dc53f54d43dbcc28522ec260aad93f57e388))
- **redis-smq:** audit messages only when enabled explicitly ([381b5ed](https://github.com/weyoss/redis-smq/commit/381b5ed3775e4e0773fb90d608b65bf001b40ff1))
- **redis-smq:** correct queue lockId to null instead of empty value ([ad33c40](https://github.com/weyoss/redis-smq/commit/ad33c40335be81be7776f0c70350f297fce4d0f5))
- **redis-smq:** expect InvalidExchangeRoutingKeyError for invalid routing keys ([8fa9a44](https://github.com/weyoss/redis-smq/commit/8fa9a44f52f9e40ab358ebfde5719702723975ac))
- **redis-smq:** restore consumer options for running tests ([6d6f6b3](https://github.com/weyoss/redis-smq/commit/6d6f6b3ec503236c997a64d21d515bf75d12df96))
- **redis-smq:** validate message handler function signature ([1076ccf](https://github.com/weyoss/redis-smq/commit/1076ccf9cae3f38c8ccf9eacb19dd06f6d0d02c3))

## 🚀 Chore

- **redis-smq-common:** update tar to v7.5.12 to address security issues ([eb32415](https://github.com/weyoss/redis-smq/commit/eb32415810c0ba7ca7abccecabe03675800068d0))
- **redis-smq-rest-api:** update koa to v3.1.2 to address security vulnerability ([a20db1c](https://github.com/weyoss/redis-smq/commit/a20db1c2b3dfdd0b9180a34fb3515d19fe3508fb))
- optimize npm keywords for maximum search coverage ([ab86170](https://github.com/weyoss/redis-smq/commit/ab861705317792f5b3bc5b0faed390f18959923a))
- rename "docs" script to "document" ([beacc25](https://github.com/weyoss/redis-smq/commit/beacc2517b61fa650db9acb90cb937a813302e2f))
- update READMEs after merging 'v9.0.14' into 'next' ([fb28ded](https://github.com/weyoss/redis-smq/commit/fb28ded9c0d44b598c8d7af2e847864cb6c4ce62))
- upgrade eslint to v10 ([b235266](https://github.com/weyoss/redis-smq/commit/b235266865b77117d9d7ef0e0328a72940901557))
- upgrade packages to latest versions to mitigate security vulnerabilities ([0533085](https://github.com/weyoss/redis-smq/commit/0533085b12ab350ec556e4b841411b8518e85125))
- use underscore for script filename convention ([4df1236](https://github.com/weyoss/redis-smq/commit/4df1236b3a78767f84f9d23591e7dc4871b28d71))

## 📝 Documentation

- **redis-smq-ci:** remove NPM badge for private package ([8959135](https://github.com/weyoss/redis-smq/commit/89591358ec8bc920b4157ea948aa24b6b821035f))
- **redis-smq-common:** update API reference ([0a8b4ec](https://github.com/weyoss/redis-smq/commit/0a8b4ecde80c2dd4519c02d16a6d2231ef2076b9))
- **redis-smq-common:** update API reference ([4ca2699](https://github.com/weyoss/redis-smq/commit/4ca26999683f303666e9ab308e9d9dda0ee451da))
- **redis-smq:** add QueueOperationValidator documentation ([62c9542](https://github.com/weyoss/redis-smq/commit/62c9542465d9110c81a9cd88c427a5d469bc2267))
- **redis-smq:** add batch message acks/unacks documentation ([bc84781](https://github.com/weyoss/redis-smq/commit/bc84781d5236cb7475b22bbb80a9cfd83a17e666))
- **redis-smq:** add message lifecycle and reliability documents ([847b0de](https://github.com/weyoss/redis-smq/commit/847b0de949720d46aec82e6eb3a28c05f1e5eb6a))
- **redis-smq:** add navigation path to main README file ([ff67c41](https://github.com/weyoss/redis-smq/commit/ff67c41ffbb304c3d66a3556a1272aaf0401ed4b))
- **redis-smq:** add queue state management guide and update API reference ([59f694c](https://github.com/weyoss/redis-smq/commit/59f694c547bace032ccc49c8a67c5c86383716c2))
- **redis-smq:** clarify difference between initialize/initializeWithConfig ([f3409b1](https://github.com/weyoss/redis-smq/commit/f3409b14a3c8db83e3893497c153df9e0fde19da))
- **redis-smq:** clean up and improve documentation for clarity ([91bc470](https://github.com/weyoss/redis-smq/commit/91bc470a10da806456ac3dc53728f28ef15e4fe5))
- **redis-smq:** clean up dual-callback-and-promise-support.md ([0381c58](https://github.com/weyoss/redis-smq/commit/0381c5847f9fa767048521f67e6ff90e692f3178))
- **redis-smq:** enhance ConsumerFactory and Consumer documentation ([e1a9c51](https://github.com/weyoss/redis-smq/commit/e1a9c518455074c744a86451a6f80c4f7e0f7ff8))
- **redis-smq:** fix incorrect error class names in JSDocs ([1bc3a74](https://github.com/weyoss/redis-smq/commit/1bc3a749c22c28d156c0bbdd2e92cb65f2cb06a1))
- **redis-smq:** fix typo in README.md file ([17ca22c](https://github.com/weyoss/redis-smq/commit/17ca22c349cda5da027ea26cb938184877917750))
- **redis-smq:** improve promise usage section to include queue creation ([bf70646](https://github.com/weyoss/redis-smq/commit/bf70646281bae00c1a86210755f53d414148220e))
- **redis-smq:** update API reference ([6e9d87a](https://github.com/weyoss/redis-smq/commit/6e9d87af3a7d020950974e7b6063fb93b89858f8))
- **redis-smq:** update API reference ([fdf2c2d](https://github.com/weyoss/redis-smq/commit/fdf2c2d4e556f41af0c7216b2cc27d1c887adb54))
- **redis-smq:** update README with initializeWithConfig() notice ([81ff69a](https://github.com/weyoss/redis-smq/commit/81ff69ac2b0dbcdd820385ef5469bd547be6df25))
- **redis-smq:** update dual callback & promise support docs ([be4c29d](https://github.com/weyoss/redis-smq/commit/be4c29d46849f9e2bbb327e95feb911fcd1a85a4))
- add promise support examples ([f145c46](https://github.com/weyoss/redis-smq/commit/f145c46facce1c6e75965fa5adcd3193d71a7eeb))

## ♻️ Code Refactoring

- **redis-smq-benchmarks:** use new configuration/bootstrap API ([97645a1](https://github.com/weyoss/redis-smq/commit/97645a1ea0a5927e48912c730aaa7effd8a647d6))
- **redis-smq-common:** add 'zpoplpush' command ([09d706e](https://github.com/weyoss/redis-smq/commit/09d706e9f26cbeebb8f35da02df25cc1028c885c))
- **redis-smq-common:** add exists() method to IRedisClient ([b39e64a](https://github.com/weyoss/redis-smq/commit/b39e64a23057cc7cccc4054ab1f3002825000999))
- **redis-smq-common:** add withOptionalCallback to async utils ([4d32dfe](https://github.com/weyoss/redis-smq/commit/4d32dfee72febbc248759e45e47493746f8d0361))
- **redis-smq-common:** improve Runnable for safe concurrent lifecycle calls ([a29c582](https://github.com/weyoss/redis-smq/commit/a29c582a992d023f3f74fb200e92ec3e51816b5a))
- **redis-smq-common:** integrate Backoff into existing components ([1f760e6](https://github.com/weyoss/redis-smq/commit/1f760e69432b551315724dbd332264be8ebc1210))
- **redis-smq-common:** introduce 'lindex' method to IRedisClient Interface ([4d81ded](https://github.com/weyoss/redis-smq/commit/4d81dedeed9e863f468206fdd9440651ba8e2362))
- **redis-smq-common:** modularize Backoff strategies for better integration ([15e2280](https://github.com/weyoss/redis-smq/commit/15e22804a285583b77fd0485c56a82935161f8db))
- **redis-smq-common:** modularize CPUMonitor for improved component integration ([8ba003d](https://github.com/weyoss/redis-smq/commit/8ba003d2792184722a2b8820ce4152bfa17a0f2b))
- **redis-smq-common:** modularize Heartbeat for improved component integration ([54e1010](https://github.com/weyoss/redis-smq/commit/54e101082f8655787a4f15413e2f2d09a3ecb37f))
- **redis-smq-common:** optimize debug and info usage throughout codebase ([1a61a76](https://github.com/weyoss/redis-smq/commit/1a61a7628fa6714620f4cb767d0ef04508a9ee5e))
- **redis-smq-common:** require 'ns' argument for createLogger() ([4875d47](https://github.com/weyoss/redis-smq/commit/4875d47ed9f19443fdf3c84f8bfac27979c245c9))
- **redis-smq-common:** restructure WorkerCluster for clearer responsibility separation ([bbd7981](https://github.com/weyoss/redis-smq/commit/bbd7981052448681605327e2c24875610bcd946a))
- **redis-smq-common:** simplify Timer utility ([3d26631](https://github.com/weyoss/redis-smq/commit/3d26631c43e452c5ea59c294d75c057d5dd97e61))
- **redis-smq-common:** update API reference ([28e6d86](https://github.com/weyoss/redis-smq/commit/28e6d86357289f5954b156ce49f993f6e2ef5094))
- **redis-smq-common:** update err type to handle any kind of thrown errors ([ace66f0](https://github.com/weyoss/redis-smq/commit/ace66f0cefc5cf236e4e35b2eea9746b15c63af0))
- **redis-smq-rest-api:** add ProcessingQueueNotEmptyError to error map ([21c6413](https://github.com/weyoss/redis-smq/commit/21c6413fd198161d548dbc8d7506b96d2fe54576))
- **redis-smq-rest-api:** add QueuePausedError to error map ([d7241cb](https://github.com/weyoss/redis-smq/commit/d7241cbac04b20499db30035ca15fc0e17fae302))
- **redis-smq-rest-api:** disable type coercion in AJV validator ([861f66d](https://github.com/weyoss/redis-smq/commit/861f66d39817f013f8a34d82aa075cd7fb8e53d6))
- **redis-smq-rest-api:** enable type coercion selectively in AJV request validation ([cade7f5](https://github.com/weyoss/redis-smq/commit/cade7f5dc1c7cd084d380170976cdc0c011f3d86))
- **redis-smq-rest-api:** redesign API to best follow REST conventions ([97aed96](https://github.com/weyoss/redis-smq/commit/97aed963189766cb939eee55338848e0b60f31d2))
- **redis-smq-rest-api:** update OpenAPI specs to v3.1, refactor project structure ([6c84a8e](https://github.com/weyoss/redis-smq/commit/6c84a8e086b9e1e566a6d9c1dc30e40d7c7299de))
- **redis-smq-rest-api:** update error map ([c9daed8](https://github.com/weyoss/redis-smq/commit/c9daed80a3ccedfcc1ee901ca1d5d9629c0162b4))
- **redis-smq-rest-api:** update error map ([d4ab528](https://github.com/weyoss/redis-smq/commit/d4ab528ca8456aab3d6466445dbdfa379995e095))
- **redis-smq-rest-api:** update errors map, fix create queue test case issues ([f4080bd](https://github.com/weyoss/redis-smq/commit/f4080bdff77c32a2e301e53caff49c5f56592889))
- **redis-smq-rest-api:** use new configuration/bootstrap API ([df0a062](https://github.com/weyoss/redis-smq/commit/df0a06253c443c66c4ee02c53d209391f9d45005))
- **redis-smq-web-server:** use new configuration/bootstrap API ([a0f55dc](https://github.com/weyoss/redis-smq/commit/a0f55dc25cbfcc0b23fe94dcbece40c450e88703))
- **redis-smq-web-ui:** delete unused QueueStatsCard.vue component ([6b10f19](https://github.com/weyoss/redis-smq/commit/6b10f190f43af8df81b4bef2af0c58a2b2054287))
- **redis-smq-web-ui:** improve UI components for clarity and maintainability ([45b53d1](https://github.com/weyoss/redis-smq/commit/45b53d1aaf641e151fbcc6ca718e9b60509f8704))
- **redis-smq-web-ui:** make formatDateSince() output more human ([519c316](https://github.com/weyoss/redis-smq/commit/519c31675fe5c660567ac168db7b2f12f3f27649))
- **redis-smq-web-ui:** remove queue rate limit section in QueueConfigurationCard ([ea82d3f](https://github.com/weyoss/redis-smq/commit/ea82d3f711c5922ea80f2659c1bd83b08e061e35))
- **redis-smq:** add lastProcessedAt prop to MessageState ([d4bfbf5](https://github.com/weyoss/redis-smq/commit/d4bfbf5f2b8ef1ae1c2b914e8799ba4f419d690d))
- **redis-smq:** add lua script to retrieve queue state ([24ef6e9](https://github.com/weyoss/redis-smq/commit/24ef6e981f26c796ff52cdfac016d05a8734f4c8))
- **redis-smq:** enhance queue-messages implementation by removing redundancies ([9a8a8ae](https://github.com/weyoss/redis-smq/commit/9a8a8ae59697475e6d9c84744da4ea7ee5c793f3))
- **redis-smq:** improve batch configuration API with nested objects ([e1748e6](https://github.com/weyoss/redis-smq/commit/e1748e65b5f6f9b0001081276ab7e9dfbfb08463))
- **redis-smq:** improve redis keys hierarchy ([0c8101b](https://github.com/weyoss/redis-smq/commit/0c8101bac77b681cbdf8da3c5a39e848c0866aba))
- **redis-smq:** integrate Heartbeat from redis-smq-common in Consumer ([0a1a937](https://github.com/weyoss/redis-smq/commit/0a1a9374430f7a13fdca1a3fc7b95224c68aa1c7))
- **redis-smq:** integrate updates from redis-smq-common into codebase ([d0e23c6](https://github.com/weyoss/redis-smq/commit/d0e23c6ed64d8287e98e59f1345a4000c9e7b2d6))
- **redis-smq:** make redis key structure more intuitive and consistent ([c988778](https://github.com/weyoss/redis-smq/commit/c988778866f73fb358aa90401c0df2734e1da66d))
- **redis-smq:** move purge job logic to PurgeQueueJobManager ([2ce3211](https://github.com/weyoss/redis-smq/commit/2ce32112c914f39cbbc6912d5f3dd1448c4c012b))
- **redis-smq:** optimize and shorten import statements ([cae93d5](https://github.com/weyoss/redis-smq/commit/cae93d5a23528cbc8490eb9124eb520089e58dc9))
- **redis-smq:** remove deprecated boolean constructor option for Consumer ([ea99061](https://github.com/weyoss/redis-smq/commit/ea990610413ab8dbac26e3efbb1e9aab27cf1621))
- **redis-smq:** rename methods for clarity and add new bindings methods ([1865fcb](https://github.com/weyoss/redis-smq/commit/1865fcb694420eed73e2e90236ccc904e6cc4baa))
- **redis-smq:** separate system and user state transition reasons ([c10b922](https://github.com/weyoss/redis-smq/commit/c10b9224bb26e83c735d36dd651c160b53ab05e5))
- **redis-smq:** shorten import ([52d5427](https://github.com/weyoss/redis-smq/commit/52d5427ca2c9a66096a3c8085e96e5670483836f))
- **redis-smq:** simplify RedisSMQ class API ([7e6837d](https://github.com/weyoss/redis-smq/commit/7e6837d7e3a07d107c611f40247a58d631144eec))
- **redis-smq:** store published messages using LISTs for efficient pagination ([4d7cc4d](https://github.com/weyoss/redis-smq/commit/4d7cc4dfc6c30f2274fd2a741246b2a6fbe084d2))
- **redis-smq:** update Consumer API reference, fix a minor typo in configuration.md ([797214d](https://github.com/weyoss/redis-smq/commit/797214d6f79eca700a766c317b2a7520531d8d20))
- **redis-smq:** update IRedisSMQConfig.logger to support boolean values ([54f586e](https://github.com/weyoss/redis-smq/commit/54f586ec1cf686a08a1870b3c1060bfcdd4972af))
- **redis-smq:** use ZPOPLPUSH instead of ZPOPRPUSH when dequeuing priority queue messages ([a3d8bf5](https://github.com/weyoss/redis-smq/commit/a3d8bf54d848a3a9188188b7e83e39f15fdcd8b1))
- **redis-smq:** use short error class names for clarity ([725bb0b](https://github.com/weyoss/redis-smq/commit/725bb0bc7cff72bb92a9117c8fa35f3f3f3349ac))
- suppress error reporting for non-operational Runnable instances ([7d6db5a](https://github.com/weyoss/redis-smq/commit/7d6db5ac10aef94fa1c7108977cb434849e877e6))

## ✅ Tests

- **redis-smq-web-server:** make sure to initialize RedisSMQ before each test ([2688459](https://github.com/weyoss/redis-smq/commit/2688459498093a42ee354d7658ae3f0ce970b1fa))
- **redis-smq:** add e2e tests for QueueOperationValidator ([d815d2e](https://github.com/weyoss/redis-smq/commit/d815d2e6cc77928c021ef41b22d1e9b78c48b67c))
- **redis-smq:** add e2e tests for QueueStateManager ([45f3376](https://github.com/weyoss/redis-smq/commit/45f33765b0b261e095499e06acc6a211cbcc7c9a))

## ⚡ Performance Improvements

- **redis-smq-benchmarks:** maximize consumer speed and track messages accurately ([acb5848](https://github.com/weyoss/redis-smq/commit/acb58484974431a298e0b8caa84cba9781460d90))

## ⚠ BREAKING CHANGES

- **redis-smq-rest-api:** redesign API to best follow REST conventions
- **redis-smq-rest-api:** update OpenAPI specs to v3.1, refactor project structure
- **redis-smq:** improve redis keys hierarchy
- **redis-smq:** make redis key structure more intuitive and consistent
- **redis-smq:** move purge job logic to PurgeQueueJobManager
- **redis-smq:** remove deprecated boolean constructor option for Consumer
- **redis-smq:** rename methods for clarity and add new bindings methods
- **redis-smq:** simplify RedisSMQ class API
- **redis-smq:** store published messages using LISTs for efficient pagination
- **redis-smq:** update IRedisSMQConfig.logger to support boolean values
- **redis-smq:** use short error class names for clarity
- refactor build process and script naming
- rename "docs" script to "document"

## 📦 Build System

- add strict bash script options for robustness and debugging ([9bd4cd2](https://github.com/weyoss/redis-smq/commit/9bd4cd202be824f4815e7bafebdf2a2a35d1a429))
- fix shell compatibility by using bash ([f4da551](https://github.com/weyoss/redis-smq/commit/f4da55123c9f1f8e8a9b32a7218890f36f943046))
- fix typo in "prepare" script ([d5e421b](https://github.com/weyoss/redis-smq/commit/d5e421bcb101f4d402ff1bc923f1c78e7edfd672))

## 👷 Continuous Integration

- consolidate changelogs into release artifacts ([8ae3a14](https://github.com/weyoss/redis-smq/commit/8ae3a142612de6d332d671d1ab7b7e74c43b78f0))
- refactor build process and script naming ([ecae108](https://github.com/weyoss/redis-smq/commit/ecae10856bf5f660f1cd2006bf036dcb84f00470))
