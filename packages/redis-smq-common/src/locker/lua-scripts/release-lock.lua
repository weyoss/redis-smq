---
--- Copyright (c)
--- Weyoss <weyoss@protonmail.com>
--- https://github.com/weyoss
---
--- This source code is licensed under the MIT license found in the LICENSE file
--- in the root directory of this source tree.
---

--- KEYS[1] keyLock
--- ARGV[1] lockId
if redis.call("get",KEYS[1]) == ARGV[1] then
    return redis.call("del",KEYS[1])
end
return 0
