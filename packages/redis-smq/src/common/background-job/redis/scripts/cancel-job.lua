--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- cancel-job.lua
-- Atomically cancels a background job and removes it from all lists
-- Cancelled jobs are hidden (only accessible via get() or list() on the hash)
--
-- KEYS[1]: backgroundJobs key (hash)
-- KEYS[2]: backgroundJobsPending key (list)
-- KEYS[3]: backgroundJobsProcessing key (list)
-- KEYS[4]: targetLockKey (string)
--
-- ARGV[1]: jobId
-- ARGV[2]: updatedJobData (JSON stringified with CANCELLED status)
-- ARGV[3]: pendingStatus (EBackgroundJobStatus.PENDING value)
-- ARGV[4]: processingStatus (EBackgroundJobStatus.PROCESSING value)
-- ARGV[5]: completedStatus (EBackgroundJobStatus.COMPLETED value)
-- ARGV[6]: failedStatus (EBackgroundJobStatus.FAILED value)
-- ARGV[7]: canceledStatus (EBackgroundJobStatus.CANCELED value)
--
-- Returns:
--  1: Success (job cancelled and hidden from lists)
--  2: Job already cancelled (no-op)
--  0: Job not found
-- -1: Job already completed (no-op)
-- -2: Job already failed (no-op)
--

-- Assign all KEYS and ARGVs to local variables
local backgroundJobsKey = KEYS[1]
local backgroundJobsPendingKey = KEYS[2]
local backgroundJobsProcessingKey = KEYS[3]
local targetLockKey = KEYS[4]

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

-- Extract status using optimized string.find()
-- Look for pattern: "status":N where N is a single digit (0-4)
local _, _, statusStr = string.find(currentJobData, '"status":(%d)')
if not statusStr then
    return 0  -- Malformed job data
end

-- Check if job is already cancelled
if statusStr == canceledStatus then
    -- Job already cancelled, ensure it's removed from all lists
    redis.call('LREM', backgroundJobsPendingKey, 0, jobId)
    redis.call('LREM', backgroundJobsProcessingKey, 0, jobId)
    redis.call('DEL', targetLockKey)
    return 2  -- Already cancelled

-- Check if job is already in terminal state (completed or failed)
elseif statusStr == completedStatus then
    -- Job already completed, just clean up from lists
    redis.call('LREM', backgroundJobsPendingKey, 0, jobId)
    redis.call('LREM', backgroundJobsProcessingKey, 0, jobId)
    return -1  -- Already completed

elseif statusStr == failedStatus then
    -- Job already failed, just clean up from lists
    redis.call('LREM', backgroundJobsPendingKey, 0, jobId)
    redis.call('LREM', backgroundJobsProcessingKey, 0, jobId)
    return -2  -- Already failed
end

-- Verify job is in cancellable state (PENDING or PROCESSING)
if statusStr ~= pendingStatus and statusStr ~= processingStatus then
    return 0  -- Job not in cancellable state
end

-- Cancel the job (mark as CANCELLED and remove from all lists)
redis.call('HSET', backgroundJobsKey, jobId, updatedJobData)  -- Update status to CANCELLED
redis.call('LREM', backgroundJobsPendingKey, 0, jobId)        -- Remove from pending (hides it)
redis.call('LREM', backgroundJobsProcessingKey, 0, jobId)     -- Remove from processing (hides it)
redis.call('DEL', targetLockKey)                             -- Release target lock

return 1  -- Successfully cancelled and hidden