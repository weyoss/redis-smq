--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- Atomically recovers a stuck job that has been confirmed to have a dead worker
-- Moves job from PROCESSING back to PENDING and cleans up resources
--
-- KEYS[1]: backgroundJobs key (hash)
-- KEYS[2]: backgroundJobsPending key (list)
-- KEYS[3]: backgroundJobsProcessing key (list)
-- KEYS[4]: jobWorkerKey (string) - maps jobId -> workerId
--
-- ARGV[1]: jobId
-- ARGV[2]: updatedJobData (JSON stringified with PENDING status + error)
-- ARGV[3]: processingStatus (EBackgroundJobStatus.PROCESSING value)
-- ARGV[4]: completedStatus (EBackgroundJobStatus.COMPLETED value)
-- ARGV[5]: failedStatus (EBackgroundJobStatus.FAILED value)
-- ARGV[6]: canceledStatus (EBackgroundJobStatus.CANCELED value)
-- ARGV[7]: recoveryMessage (string) - error message to set on recovered job
--
-- Returns:
--  1: Success (job recovered)
--  0: Job not found or not in recoverable state
-- -1: Job already completed (no-op)
-- -2: Job already failed (no-op)
-- -3: Job already cancelled (no-op)
--

-- Assign all KEYS and ARGVs to local variables
local backgroundJobsKey = KEYS[1]
local backgroundJobsPendingKey = KEYS[2]
local backgroundJobsProcessingKey = KEYS[3]
local jobWorkerKey = KEYS[4]

local jobId = ARGV[1]
local updatedJobData = ARGV[2]
local processingStatus = ARGV[3]
local completedStatus = ARGV[4]
local failedStatus = ARGV[5]
local canceledStatus = ARGV[6]
local recoveryMessage = ARGV[7]

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

-- Check if job is already in terminal state
if statusStr == completedStatus then
    -- Job already completed, just clean up
    redis.call('LREM', backgroundJobsProcessingKey, 0, jobId)
    redis.call('DEL', jobWorkerKey)
    return -1  -- Already completed
elseif statusStr == failedStatus then
    -- Job already failed, just clean up
    redis.call('LREM', backgroundJobsProcessingKey, 0, jobId)
    redis.call('DEL', jobWorkerKey)
    return -2  -- Already failed
elseif statusStr == canceledStatus then
    -- Job already cancelled, just clean up
    redis.call('LREM', backgroundJobsProcessingKey, 0, jobId)
    redis.call('DEL', jobWorkerKey)
    return -3  -- Already cancelled
end

-- Only PROCESSING jobs can be recovered
if statusStr ~= processingStatus then
    return 0  -- Job not in PROCESSING state
end

-- Recover the job
redis.call('HSET', backgroundJobsKey, jobId, updatedJobData)  -- Update status to PENDING
redis.call('LREM', backgroundJobsProcessingKey, 0, jobId)     -- Remove from processing list
redis.call('LPUSH', backgroundJobsPendingKey, jobId)          -- Add back to pending list for reprocessing
redis.call('DEL', jobWorkerKey)                               -- Remove worker-job link

return 1  -- Successfully recovered