---
--- Copyright (c)
--- Weyoss <weyoss@outlook.com>
--- https://github.com/weyoss
---
--- This source code is licensed under the MIT license found in the LICENSE file
--- in the root directory of this source tree.
---

--- KEYS[1] source sorted-set key
--- KEYS[2] destination list key
---
--- Atomically pop the lowest-score member of `source` and push it to the
--- tail of `destination`.
local members = redis.call("ZRANGE", KEYS[1], 0, 0)
local messageId = members[1]
if messageId then
    redis.call("ZREM", KEYS[1], messageId)
    redis.call("RPUSH", KEYS[2], messageId)
    return messageId
end
return nil