import { z } from 'zod';
import { ulid } from 'ulid';

// ULID regex: 26 characters, Crockford Base32
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

// Branded types for type safety at compile time
export type CorrelationId = string & { readonly __brand: 'CorrelationId' };
export type RequestId = string & { readonly __brand: 'RequestId' };
export type SessionId = string & { readonly __brand: 'SessionId' };
export type OrganizationId = string & { readonly __brand: 'OrganizationId' };
export type MembershipId = string & { readonly __brand: 'MembershipId' };
export type InviteId = string & { readonly __brand: 'InviteId' };
export type WorkItemId = string & { readonly __brand: 'WorkItemId' };
export type AgentId = string & { readonly __brand: 'AgentId' };

// Zod schemas with ULID validation
export const CorrelationIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for CorrelationId')
  .transform((val) => val as CorrelationId);

export const RequestIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for RequestId')
  .transform((val) => val as RequestId);

export const SessionIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for SessionId')
  .transform((val) => val as SessionId);

export const OrganizationIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for OrganizationId')
  .transform((val) => val as OrganizationId);

export const MembershipIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for MembershipId')
  .transform((val) => val as MembershipId);

export const InviteIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for InviteId')
  .transform((val) => val as InviteId);

export const WorkItemIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for WorkItemId')
  .transform((val) => val as WorkItemId);

export const AgentIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for AgentId')
  .transform((val) => val as AgentId);

// ID generation utilities
export function generateCorrelationId(): CorrelationId {
  return ulid() as CorrelationId;
}

export function generateRequestId(): RequestId {
  return ulid() as RequestId;
}

export function generateSessionId(): SessionId {
  return ulid() as SessionId;
}

export function generateOrganizationId(): OrganizationId {
  return ulid() as OrganizationId;
}

export function generateMembershipId(): MembershipId {
  return ulid() as MembershipId;
}

export function generateInviteId(): InviteId {
  return ulid() as InviteId;
}

export function generateWorkItemId(): WorkItemId {
  return ulid() as WorkItemId;
}

export function generateAgentId(): AgentId {
  return ulid() as AgentId;
}
