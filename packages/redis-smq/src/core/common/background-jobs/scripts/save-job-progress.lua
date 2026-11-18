--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Atomically updates a purge job's progress blob ONLY if the job is still in
-- the expected PROCESSING state. Prevents a stale in-memory job from clobbering
-- a Cancel (or Complete/Fail) that landed after the caller's last status check.
--
-- KEYS[1]: backgroundJobs key (hash) — maps jobId -> JSON
--
-- ARGV[1]: jobId
-- ARGV[2]: updatedJobData (JSON with updated meta.purged / updatedAt)
-- ARGV[3]: processingStatus (EBackgroundJobStatus.PROCESSING as string)
--
-- Returns:
--  1: Success (progress saved)
--  0: Job not found (deleted elsewhere)
-- -1: Job not in PROCESSING state (cancelled/failed/completed concurrently)

local jobsKey = KEYS[1]
local jobId = ARGV[1]
local updatedJobData = ARGV[2]
local processingStatus = ARGV[3]

local currentJobData = redis.call('HGET', jobsKey, jobId)
if currentJobData == false then
    return 0
end

-- Same status-extraction pattern as cancel-job.lua / complete-job.lua.
local _, _, statusStr = string.find(currentJobData, '"status":(%d)')
if not statusStr then
    return 0
end

if statusStr ~= processingStatus then
    return -1
end

redis.call('HSET', jobsKey, jobId, updatedJobData)
return 1