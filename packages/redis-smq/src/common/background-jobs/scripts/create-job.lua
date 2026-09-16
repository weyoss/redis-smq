--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- Atomically creates a background job
--
-- KEYS[1]: backgroundJobs key (hash)
-- KEYS[2]: backgroundJobsPending key (list)
--
-- ARGV[1]: jobId
-- ARGV[2]: jobData (JSON stringified)
--
-- Returns:
--  1: Success (job created)
-- -1: Job already exists
--

-- Assign all KEYS and ARGVs to local variables
local backgroundJobsKey = KEYS[1]
local backgroundJobsPendingKey = KEYS[2]

local jobId = ARGV[1]
local jobData = ARGV[2]

-- Check if job already exists
local jobExists = redis.call('HEXISTS', backgroundJobsKey, jobId)
if jobExists == 1 then
    return -1  -- Job already exists
end

-- Create the job atomically
redis.call('HSET', backgroundJobsKey, jobId, jobData)  -- Store job in hash
redis.call('LPUSH', backgroundJobsPendingKey, jobId)   -- Add to pending list

return 1  -- Success