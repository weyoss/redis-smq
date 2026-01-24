--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- Atomically completes a background job and releases target lock
--
-- KEYS[1]: backgroundJobs key (hash)
-- KEYS[2]: backgroundJobsProcessing key (list)
-- KEYS[3]: targetLockKey (string)
--
-- ARGV[1]: jobId
-- ARGV[2]: updatedJobData (JSON stringified with COMPLETED status)
-- ARGV[3]: pendingStatus (EBackgroundJobStatus.PENDING value)
-- ARGV[4]: processingStatus (EBackgroundJobStatus.PROCESSING value)
-- ARGV[5]: completedStatus (EBackgroundJobStatus.COMPLETED value)
-- ARGV[6]: failedStatus (EBackgroundJobStatus.FAILED value)
-- ARGV[7]: canceledStatus (EBackgroundJobStatus.CANCELED value)
--
-- Returns:
--  1: Success (job completed)
--  2: Job already completed (no-op)
--  0: Job not found
-- -1: Job already failed (no-op)
-- -2: Job already cancelled (no-op)
--

-- Assign all KEYS and ARGVs to local variables
local backgroundJobsKey = KEYS[1]
local backgroundJobsProcessingKey = KEYS[2]
local targetLockKey = KEYS[3]

local jobId = ARGV[1]
local updatedJobData = ARGV[2]
local pendingStatus = ARGV[3]
local processingStatus = ARGV[4]
local completedStatus = ARGV[5]
local failedStatus = ARGV[6]
local canceledStatus = ARGV[7]

-- Get current job data from Redis
local currentJobData = redis.call('HGET', backgroundJobsKey, jobId)
if currentJobData == false then
    return 0  -- Job not found
end

-- Extract current status using optimized string.find()
local _, _, statusStr = string.find(currentJobData, '"status":(%d)')
if not statusStr then
    return 0  -- Malformed job data
end

-- Check if job is already completed
if statusStr == completedStatus then
    -- Job already completed, just remove from processing list
    redis.call('LREM', backgroundJobsProcessingKey, 0, jobId)
    return 2  -- Already completed

-- Check if job is already in terminal state (failed or cancelled)
elseif statusStr == failedStatus then
    -- Job already failed, just remove from processing list
    redis.call('LREM', backgroundJobsProcessingKey, 0, jobId)
    return -1  -- Already failed

elseif statusStr == canceledStatus then
    -- Job already cancelled, just remove from processing list
    redis.call('LREM', backgroundJobsProcessingKey, 0, jobId)
    return -2  -- Already cancelled
end

-- Verify job is in PROCESSING state (only processing jobs can be completed)
if statusStr ~= processingStatus then
    return 0  -- Job not in PROCESSING state
end

-- Complete the job
redis.call('HSET', backgroundJobsKey, jobId, updatedJobData)  -- Update status to COMPLETED
redis.call('LREM', backgroundJobsProcessingKey, 0, jobId)     -- Remove from processing list
redis.call('DEL', targetLockKey)                             -- Release target lock

return 1  -- Successfully completed