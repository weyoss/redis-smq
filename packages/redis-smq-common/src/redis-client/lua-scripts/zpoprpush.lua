---
--- Copyright (c)
--- Weyoss <weyoss@protonmail.com>
--- https://github.com/weyoss
---
--- This source code is licensed under the MIT license found in the LICENSE file
--- in the root directory of this source tree.
---

local keySortedSet = KEYS[1]
local keyList = KEYS[2]

if redis.call("EXISTS", keySortedSet) == 1 then
    local result = redis.call("ZRANGE", keySortedSet, 0, 0)
    if #(result) then
        local messageId = result[1]
        redis.call("ZREM", keySortedSet, messageId)
        redis.call("RPUSH", keyList, messageId)
        return messageId
    end
end
return nil