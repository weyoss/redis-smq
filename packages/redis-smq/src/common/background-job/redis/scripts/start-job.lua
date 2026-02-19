--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- Atomically marks a background job as PROCESSING
-- Should only be called by workers after acquiring a job
--
-- KEYS[1]: backgroundJobs key (hash)
-- KEYS[2]: backgroundJobsProcessing key (list) - job should already be here
--
-- ARGV[1]: jobId
-- ARGV[2]: updatedJobData (JSON stringified with PROCESSING status)
-- ARGV[3]: pendingStatus (EBackgroundJobStatus.PENDING value)
-- ARGV[4]: processingStatus (EBackgroundJobStatus.PROCESSING value)
-- ARGV[5]: completedStatus (EBackgroundJobStatus.COMPLETED value)
-- ARGV[6]: failedStatus (EBackgroundJobStatus.FAILED value)
-- ARGV[7]: canceledStatus (EBackgroundJobStatus.CANCELED value)
--
-- Returns:
--  1: Success (job started)
--  2: Job already processing (no-op)
--  0: Job not found
-- -1: Job already completed (no-op)
-- -2: Job already failed (no-op)
-- -3: Job already cancelled (no-op)
--

-- Assign all KEYS and ARGVs to local variables
local backgroundJobsKey = KEYS[1]
local backgroundJobsProcessingKey = KEYS[2]

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

-- Check if job is already processing
if statusStr == processingStatus then
    return 2  -- Already processing

-- Check if job is already in terminal state
elseif statusStr == completedStatus then
    return -1  -- Already completed

elseif statusStr == failedStatus then
    return -2  -- Already failed

elseif statusStr == canceledStatus then
    return -3  -- Already cancelled
end

-- Verify job is in PENDING state (only pending jobs can be started)
if statusStr ~= pendingStatus then
    return 0  -- Job not in PENDING state
end

-- Verify job is in the processing list
local isInProcessingList = redis.call('LREM', backgroundJobsProcessingKey, 0, jobId)
if isInProcessingList == 0 then
    return 0  -- Job not in processing list
end
-- Add it back since we removed it with LREM
redis.call('RPUSH', backgroundJobsProcessingKey, jobId)

-- Start the job (mark as PROCESSING)
redis.call('HSET', backgroundJobsKey, jobId, updatedJobData)

return 1  -- Successfully started