--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- Atomically creates a background job with target locking
--
-- KEYS[1]: backgroundJobs key (hash)
-- KEYS[2]: backgroundJobsPending key (list)
-- KEYS[3]: targetLockKey (string)
--
-- ARGV[1]: jobId
-- ARGV[2]: jobData (JSON stringified)
-- ARGV[3]: targetLockValue (usually jobId)
--
-- Returns:
--  1: Success (job created)
--  0: Target already locked (cannot create job)
-- -1: Job already exists
--

-- Assign all KEYS and ARGVs to local variables
local backgroundJobsKey = KEYS[1]
local backgroundJobsPendingKey = KEYS[2]
local targetLockKey = KEYS[3]

local jobId = ARGV[1]
local jobData = ARGV[2]
local targetLockValue = ARGV[3]

-- Check if target is already locked
local isTargetLocked = redis.call('EXISTS', targetLockKey)
if isTargetLocked == 1 then
    return 0  -- Target is locked
end

-- Check if job already exists
local jobExists = redis.call('HEXISTS', backgroundJobsKey, jobId)
if jobExists == 1 then
    return -1  -- Job already exists
end

-- Create the job atomically
redis.call('HSET', backgroundJobsKey, jobId, jobData)  -- Store job in hash
redis.call('LPUSH', backgroundJobsPendingKey, jobId)   -- Add to pending list
redis.call('SET', targetLockKey, targetLockValue)      -- Lock the target

return 1  -- Success