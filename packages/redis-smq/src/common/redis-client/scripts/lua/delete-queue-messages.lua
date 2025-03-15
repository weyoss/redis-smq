local keyQueueMessages = KEYS[1]

local keyMessagePart = ARGV[1]
local keySeparator = ARGV[2]

local cursor = "0";
local count = 0;
repeat
    local result = redis.call("SSCAN", keyQueueMessages, cursor, "COUNT", 100);
    local ids = result[2];
    for i = 1, #ids do
        --- todo this will not work while using a redis cluster
        --- keys must be passed
        local key = table.concat({ keyMessagePart, keySeparator, ids[i] });
        redis.call("UNLINK", key);
        count = count + 1;
    end ;
    cursor = result[1];
until cursor == "0";
redis.call("UNLINK", keyQueueMessages);
return count