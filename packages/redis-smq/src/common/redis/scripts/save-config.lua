--
-- Copyright (c)
-- Weyoss <weyoss@outlook.com>
-- https://github.com/weyoss
--
-- This source code is licensed under the MIT license found in the LICENSE file
-- in the root directory of this source tree.
--
-- Description:
-- Atomically saves configuration to Redis using a hash structure with version control.
-- This prevents race conditions by checking that the current version matches the
-- expected version before updating.
--
-- KEYS[1]: keyConfiguration - The key where configuration is stored
--
-- ARGV:
-- ARGV[1]: versionField - The field name for storing the version (e.g., 'version')
-- ARGV[2]: dataField - The field name for storing the config (e.g., 'config')
-- ARGV[3]: expectedVersion - The version we expect to be currently stored
-- ARGV[4]: data - JSON string of the configuration to save
--
-- Returns:
--   - The configuration version after update
--   - 'VERSION_MISMATCH' if the expected version doesn't match current version

local keyConfiguration = KEYS[1]

local versionField = ARGV[1]
local dataField = ARGV[2]
local expectedVersion = tonumber(ARGV[3])
local data = ARGV[4]

-- Check if configuration exists by checking if version field exists
local currentVersion = redis.call("HGET", keyConfiguration, versionField)

-- If configuration doesn't exist, this is the first save
if currentVersion == false then
    -- Create new configuration with version 1
    redis.call("HSET", keyConfiguration, versionField, 1)
    redis.call("HSET", keyConfiguration, dataField, data)
    return 1
end

-- Convert to number for comparison
currentVersion = tonumber(currentVersion)

-- Check version match
if currentVersion ~= expectedVersion then
    return 'VERSION_MISMATCH'
end

-- Update configuration with incremented version
redis.call("HSET", keyConfiguration, dataField, data)
local newVersion = redis.call("HINCRBY", keyConfiguration, versionField, 1)

-- Success
return newVersion;