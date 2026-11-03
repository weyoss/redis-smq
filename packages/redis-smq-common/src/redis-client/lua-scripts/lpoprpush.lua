---
--- Copyright (c)
--- Weyoss <weyoss@outlook.com>
--- https://github.com/weyoss
---
--- This source code is licensed under the MIT license found in the LICENSE file
--- in the root directory of this source tree.
---

--- KEYS[1] source list key
--- KEYS[2] destination list key
---
--- Atomically pop the head of `source` and push it to the tail of
--- `destination`. Redis 6.2's `LMOVE LEFT RIGHT` does the same, but this
--- script supports older versions.
local message = redis.call("LPOP", KEYS[1])
if message then
    redis.call("RPUSH", KEYS[2], message)
    return message
end
return nil