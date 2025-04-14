
# RedisSMQ V8 Release Notes

## Overview
RedisSMQ v8 represents a major evolution of our message queue system, with significant improvements to architecture, 
performance, and developer experience. This release focuses on reliability, scalability, and modern development practices.

## Table of Contents
- [Overview](#overview)
- [New Features](#new-features)
- [Improvements](#improvements)
- [Breaking Changes](#breaking-changes)
- [Compatibility](#compatibility)
- [Documentation](#documentation)

## New Features

### Core Architecture
- **System Redesign**: Updated the core codebase to support multiple message types and delivery models for better reliability and scalability
- **Queue-Scoped Workers**: Replaced global workers with workers specific to each queue for better resource management
- **Monorepo Structure**: Moved to a monorepo setup for easier package organization, dependency management, and development workflow

### Messaging
- **Pub/Sub Model**: Implemented a publish/subscribe pattern alongside existing queue models, enabling broadcast messaging to multiple consumers
- **Message Tracking**: Added comprehensive message lifecycle tracking with unique IDs from publication to consumption
- **Message Envelope**: Redesigned messages into  `ProducibleMessage`, `ConsumableMessage`, and `MessageEnvelope` for clearer separation of concerns

### API
- **Enhanced Message Status API**: Introduced `getMessageStatus()` method and status tracking for improved visibility into message processing
- **REST API Integration**: Created a comprehensive REST API with OpenAPI specification for managing queues and messages

### Tools
- **Embedded Redis Server**: Integrated an embedded Redis server for streamlined development and testing

## Improvements

### Performance & Reliability
- **LUA Scripts**: Moved Redis operations to LUA scripts for atomic execution, better performance, and data consistency
- **Worker Threads**: Enabled running message handlers in separate threads for better isolation and performance
- **Async Error Handling**: Improved error handling patterns for asynchronous operations

### Developer Experience
- **TypeScript Definitions:**: Improved type definitions throughout the codebase
- **Unified Events**: Simplified event listeners into a consistent API
- **Typed Events**: Implemented TypeScript event types for improved type safety and developer experience
- **Error Classes**: Developed specialized error classes for precise error reporting
- **PNPM**: Switched to PNPM for faster and more efficient package management

### Code Quality
- **Code Refactoring**: Improved readability, maintainability, and adherence to best practices
- **Standard Patterns**: Applied consistent design patterns throughout the codebase
- **Testing Framework**: Migrated to vitest for more effective testing

## Breaking Changes
- **API Changes**: Several API changes require updates to existing code
- **Data Structure**: Redis data structures are NOT compatible with v7.x

## Compatibility
- **Node.js**: Supports Node.js v20 and above, with full testing on v20
- **Redis**: Supports Redis v4 and above, with full testing on v7.2.8

## Documentation
- **API Documentation and Guides**: Completely revamped API documentation with interactive examples and detailed explanations
- **Diagrams**: Added new diagrams illustrating queuing models and queue delivery models