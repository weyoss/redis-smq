
# RedisSMQ V8 Release Notes

## Overview
RedisSMQ v8 represents a major evolution of our message queue system, with significant improvements to architecture, performance, and developer experience. This release focuses on reliability, scalability, and modern development practices.

## Table of Contents
- [Overview](#overview)
- [New Features](#new-features)
- [Improvements](#improvements)
- [Breaking Changes](#breaking-changes)
- [Compatibility](#compatibility)
- [Documentation](#documentation)

## New Features

### Core Architecture
- **Reworked System Design**: Refactored the message queue core codebase to support multiple message types and delivery models with focus on reliability and scalability
- **Queue-Scoped Workers**: Replaced global workers with queue-scoped workers for better resource allocation and management
- **Migration to Monorepo**: Restructured into a monorepo architecture for improved package organization, dependency management, and development workflow

### Messaging
- **Pub/Sub Delivery Model**: Implemented a publish/subscribe pattern alongside existing queue models, enabling broadcast messaging to multiple consumers
- **Message Tracking System**: Added comprehensive message lifecycle tracking with unique IDs from publication to consumption
- **Message Envelope Architecture**: Redesigned with `ProducibleMessage`/`ConsumableMessage`/`MessageEnvelope` for clearer separation of concerns

### API
- **Enhanced Message Status API**: Introduced `getMessageStatus()` method and status tracking for improved visibility into message processing
- **REST API Integration**: Created a comprehensive REST API with OpenAPI specification for managing queues and messages

### Tools
- **Embedded Redis Server**: Integrated an embedded Redis server for streamlined development and testing

## Improvements

### Performance & Reliability
- **LUA-Based Operations**: Migrated Redis operations to LUA scripts for atomic execution, improved performance, and data consistency
- **Worker Threads**: Added support for isolating message handlers in separate worker threads to prevent blocking the main event loop
- **Async Error Handling**: Implemented robust error handling patterns for asynchronous operations

### Developer Experience
- **Enhanced TypeScript Definitions**: Improved type definitions throughout the codebase for better IDE integration and compile-time checks
- **Unified Event System**: Consolidated consumer/producer event listeners into a consistent, predictable API
- **Typed Events**: Implemented TypeScript event types for improved type safety and developer experience
- **Granular Error Handling**: Developed specialized error classes for precise error reporting and handling
- **PNPM Package Manager**: Replaced NPM with PNPM for faster, more efficient package management

### Code Quality
- **Code Structure Optimization**: Refactored for improved readability, maintainability, and adherence to best practices
- **Standardized Patterns**: Implemented consistent design patterns throughout the codebase
- **Enhanced Testing Framework**: Migrated to vitest framework for more effective testing

## Breaking Changes
- **API Changes**: Several API changes require updates to existing code
- **Data Structure Compatibility**: Redis data structures are NOT compatible with v7.x

## Compatibility
- **Node.js Compatibility**: Supports Node.js v20 and above, with full testing on v20 and v22
- **Redis Compatibility**: Supports Redis v4 and above, with full testing on v7.2.8

## Documentation
- **Interactive API Documentation**: Completely revamped API documentation with interactive examples and detailed explanations
- **Architectural Diagrams**: Added new system architecture, message flow, and component interaction diagrams
