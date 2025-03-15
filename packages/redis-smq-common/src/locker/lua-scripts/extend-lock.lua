---
--- Copyright (c)
--- Weyoss <weyoss@protonmail.com>
--- https://github.com/weyoss
---
--- This source code is licensed under the MIT license found in the LICENSE file
--- in the root directory of this source tree.
---

--- KEYS[1] lock_key
--- ARGV[1] lock_id
--- ARGV[2] ttl
if redis.call("get",KEYS[1]) == ARGV[1] then
    return redis.call("PEXPIRE", KEYS[1], ARGV[2])
end
return 0
