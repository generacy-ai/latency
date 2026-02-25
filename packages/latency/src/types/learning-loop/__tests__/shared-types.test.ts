import { describe, it, expect } from 'vitest';
import {
  LearningCoachingDataIdSchema,
  KnowledgeUpdateIdSchema,
  PatternCandidateIdSchema,
  LearningEventIdSchema,
  LearningSessionIdSchema,
  OverrideReasonSchema,
  LearningScopeAppliesToSchema,
  KnowledgeUpdateTypeSchema,
  UpdateStatusSchema,
  LearningPatternStatusSchema,
  LearningEventTypeSchema,
  KnowledgeChangeTargetTypeSchema,
  KnowledgeChangeOperationSchema,
} from '../shared-types.js';

describe('ID Schemas', () => {
  describe('LearningCoachingDataIdSchema', () => {
    it('accepts valid coaching ID', () => {
      expect(LearningCoachingDataIdSchema.safeParse('coaching_abc12345').success).toBe(true);
      expect(LearningCoachingDataIdSchema.safeParse('coaching_12345678').success).toBe(true);
    });

    it('rejects invalid prefix', () => {
      expect(LearningCoachingDataIdSchema.safeParse('coach_abc12345').success).toBe(false);
      expect(LearningCoachingDataIdSchema.safeParse('update_abc12345').success).toBe(false);
    });

    it('rejects short suffix', () => {
      expect(LearningCoachingDataIdSchema.safeParse('coaching_abc').success).toBe(false);
    });
  });

  describe('KnowledgeUpdateIdSchema', () => {
    it('accepts valid update ID', () => {
      expect(KnowledgeUpdateIdSchema.safeParse('update_abc12345').success).toBe(true);
    });

    it('rejects invalid prefix', () => {
      expect(KnowledgeUpdateIdSchema.safeParse('coaching_abc12345').success).toBe(false);
    });
  });

  describe('PatternCandidateIdSchema', () => {
    it('accepts valid pattern ID', () => {
      expect(PatternCandidateIdSchema.safeParse('pattern_abc12345').success).toBe(true);
    });

    it('rejects invalid prefix', () => {
      expect(PatternCandidateIdSchema.safeParse('pat_abc12345').success).toBe(false);
    });
  });

  describe('LearningEventIdSchema', () => {
    it('accepts valid event ID', () => {
      expect(LearningEventIdSchema.safeParse('event_abc12345').success).toBe(true);
    });

    it('rejects invalid prefix', () => {
      expect(LearningEventIdSchema.safeParse('evt_abc12345').success).toBe(false);
    });
  });

  describe('LearningSessionIdSchema', () => {
    it('accepts valid session ID', () => {
      expect(LearningSessionIdSchema.safeParse('session_abc12345').success).toBe(true);
    });

    it('rejects invalid prefix', () => {
      expect(LearningSessionIdSchema.safeParse('sess_abc12345').success).toBe(false);
    });
  });
});

describe('Enum Schemas', () => {
  describe('OverrideReasonSchema', () => {
    it('accepts all valid override reasons', () => {
      expect(OverrideReasonSchema.safeParse('reasoning_incorrect').success).toBe(true);
      expect(OverrideReasonSchema.safeParse('missing_context').success).toBe(true);
      expect(OverrideReasonSchema.safeParse('priorities_changed').success).toBe(true);
      expect(OverrideReasonSchema.safeParse('exception_case').success).toBe(true);
      expect(OverrideReasonSchema.safeParse('other').success).toBe(true);
    });

    it('rejects invalid override reason', () => {
      expect(OverrideReasonSchema.safeParse('invalid_reason').success).toBe(false);
    });
  });

  describe('LearningScopeAppliesToSchema', () => {
    it('accepts all valid scope values', () => {
      expect(LearningScopeAppliesToSchema.safeParse('this_decision').success).toBe(true);
      expect(LearningScopeAppliesToSchema.safeParse('this_project').success).toBe(true);
      expect(LearningScopeAppliesToSchema.safeParse('this_domain').success).toBe(true);
      expect(LearningScopeAppliesToSchema.safeParse('general').success).toBe(true);
    });

    it('rejects invalid scope', () => {
      expect(LearningScopeAppliesToSchema.safeParse('global').success).toBe(false);
    });
  });

  describe('KnowledgeUpdateTypeSchema', () => {
    it('accepts all valid update types', () => {
      expect(KnowledgeUpdateTypeSchema.safeParse('new_principle').success).toBe(true);
      expect(KnowledgeUpdateTypeSchema.safeParse('refine_principle').success).toBe(true);
      expect(KnowledgeUpdateTypeSchema.safeParse('new_pattern').success).toBe(true);
      expect(KnowledgeUpdateTypeSchema.safeParse('context_update').success).toBe(true);
      expect(KnowledgeUpdateTypeSchema.safeParse('no_update').success).toBe(true);
    });

    it('rejects invalid update type', () => {
      expect(KnowledgeUpdateTypeSchema.safeParse('delete_principle').success).toBe(false);
    });
  });

  describe('UpdateStatusSchema', () => {
    it('accepts all valid statuses', () => {
      expect(UpdateStatusSchema.safeParse('pending').success).toBe(true);
      expect(UpdateStatusSchema.safeParse('applied').success).toBe(true);
      expect(UpdateStatusSchema.safeParse('rejected').success).toBe(true);
    });

    it('rejects invalid status', () => {
      expect(UpdateStatusSchema.safeParse('cancelled').success).toBe(false);
    });
  });

  describe('LearningPatternStatusSchema', () => {
    it('accepts all valid pattern statuses', () => {
      expect(LearningPatternStatusSchema.safeParse('detected').success).toBe(true);
      expect(LearningPatternStatusSchema.safeParse('presented').success).toBe(true);
      expect(LearningPatternStatusSchema.safeParse('accepted').success).toBe(true);
      expect(LearningPatternStatusSchema.safeParse('rejected').success).toBe(true);
    });

    it('rejects invalid pattern status', () => {
      expect(LearningPatternStatusSchema.safeParse('pending').success).toBe(false);
    });
  });

  describe('LearningEventTypeSchema', () => {
    it('accepts all valid event types', () => {
      expect(LearningEventTypeSchema.safeParse('decision_made').success).toBe(true);
      expect(LearningEventTypeSchema.safeParse('coaching_provided').success).toBe(true);
      expect(LearningEventTypeSchema.safeParse('pattern_detected').success).toBe(true);
      expect(LearningEventTypeSchema.safeParse('principle_created').success).toBe(true);
      expect(LearningEventTypeSchema.safeParse('principle_refined').success).toBe(true);
      expect(LearningEventTypeSchema.safeParse('context_updated').success).toBe(true);
    });

    it('rejects invalid event type', () => {
      expect(LearningEventTypeSchema.safeParse('session_started').success).toBe(false);
    });
  });

  describe('KnowledgeChangeTargetTypeSchema', () => {
    it('accepts all valid target types', () => {
      expect(KnowledgeChangeTargetTypeSchema.safeParse('philosophy').success).toBe(true);
      expect(KnowledgeChangeTargetTypeSchema.safeParse('principle').success).toBe(true);
      expect(KnowledgeChangeTargetTypeSchema.safeParse('pattern').success).toBe(true);
      expect(KnowledgeChangeTargetTypeSchema.safeParse('context').success).toBe(true);
    });

    it('rejects invalid target type', () => {
      expect(KnowledgeChangeTargetTypeSchema.safeParse('value').success).toBe(false);
    });
  });

  describe('KnowledgeChangeOperationSchema', () => {
    it('accepts all valid operations', () => {
      expect(KnowledgeChangeOperationSchema.safeParse('create').success).toBe(true);
      expect(KnowledgeChangeOperationSchema.safeParse('update').success).toBe(true);
      expect(KnowledgeChangeOperationSchema.safeParse('deprecate').success).toBe(true);
    });

    it('rejects invalid operation', () => {
      expect(KnowledgeChangeOperationSchema.safeParse('delete').success).toBe(false);
    });
  });
});
