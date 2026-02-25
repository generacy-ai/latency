# API

Platform API contract types for the Generacy backend services.

## Purpose

This directory contains TypeScript interfaces and Zod schemas that define the contracts for Generacy's platform APIs. These types ensure type-safe communication between frontend applications (Generacy, Humancy) and backend services (Generacy Cloud).

## Subdirectories

### auth/
Authentication and authorization types:
- Login/signup request and response schemas
- Token management types
- Session handling
- OAuth integration contracts

### organization/
Multi-tenancy and organization management:
- Organization creation and configuration
- Member management and roles
- Team and workspace types
- Organization settings and preferences

### subscription/
Billing and subscription management:
- Plan types and tiers
- Subscription lifecycle events
- Usage tracking and limits
- Billing information schemas

## Usage

```typescript
import {
  LoginRequest,
  LoginResponse,
  OrganizationSettings,
  SubscriptionPlan
} from '@generacy-ai/latency';
```

## Design Principle

API types are separated from other contracts because they specifically define HTTP API boundaries. This separation:
- Makes API contracts easy to discover and document
- Enables automatic API documentation generation
- Provides clear versioning for API evolution
- Separates external API contracts from internal messaging

## Migration Note

Types migrated from `@generacy-ai/contracts/schemas/platform-api` as part of the contracts repository retirement (2026-02-24).
