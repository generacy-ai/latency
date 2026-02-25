import { describe, it, expect } from 'vitest';
import {
  WorkflowDefinition,
  WorkflowDefinitionSchema,
  WorkflowIdSchema,
  WorkflowStepIdSchema,
  WorkflowTrigger,
  WorkflowTriggerSchema,
  WorkflowTriggerTypeSchema,
  WorkflowStep,
  WorkflowStepSchema,
  WorkflowStepTypeSchema,
  WorkflowVersionSchema,
  WorkflowParameterSchema,
  ParameterTypeSchema,
  OnErrorStrategySchema,
  RetryConfigSchema,
  StepBranchSchema,
  ScheduleConfigSchema,
  WebhookConfigSchema,
  EventConfigSchema,
  ManualConfigSchema,
  generateWorkflowId,
  generateWorkflowStepId,
  parseWorkflowDefinition,
  safeParseWorkflowDefinition,
  parseWorkflowTrigger,
  safeParseWorkflowTrigger,
  parseWorkflowStep,
  safeParseWorkflowStep,
} from '../definition.js';

// ============================================================================
// ID Schemas
// ============================================================================

describe('WorkflowIdSchema', () => {
  it('accepts valid ULID format', () => {
    const result = WorkflowIdSchema.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(result.success).toBe(true);
  });

  it('rejects invalid format', () => {
    expect(WorkflowIdSchema.safeParse('invalid').success).toBe(false);
    expect(WorkflowIdSchema.safeParse('').success).toBe(false);
    expect(WorkflowIdSchema.safeParse('123').success).toBe(false);
  });
});

describe('generateWorkflowId', () => {
  it('generates valid ULID', () => {
    const id = generateWorkflowId();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(26);

    const result = WorkflowIdSchema.safeParse(id);
    expect(result.success).toBe(true);
  });

  it('generates unique IDs', () => {
    const id1 = generateWorkflowId();
    const id2 = generateWorkflowId();
    expect(id1).not.toBe(id2);
  });
});

describe('WorkflowStepIdSchema', () => {
  it('accepts valid ULID format', () => {
    const result = WorkflowStepIdSchema.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(result.success).toBe(true);
  });

  it('rejects invalid format', () => {
    expect(WorkflowStepIdSchema.safeParse('invalid').success).toBe(false);
  });
});

describe('generateWorkflowStepId', () => {
  it('generates valid ULID', () => {
    const id = generateWorkflowStepId();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(26);

    const result = WorkflowStepIdSchema.safeParse(id);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Workflow Version
// ============================================================================

describe('WorkflowVersionSchema', () => {
  it('accepts valid semantic versions', () => {
    expect(WorkflowVersionSchema.safeParse('1.0.0').success).toBe(true);
    expect(WorkflowVersionSchema.safeParse('0.1.0').success).toBe(true);
    expect(WorkflowVersionSchema.safeParse('10.20.30').success).toBe(true);
  });

  it('rejects invalid versions', () => {
    expect(WorkflowVersionSchema.safeParse('1.0').success).toBe(false);
    expect(WorkflowVersionSchema.safeParse('v1.0.0').success).toBe(false);
    expect(WorkflowVersionSchema.safeParse('1.0.0-beta').success).toBe(false);
    expect(WorkflowVersionSchema.safeParse('').success).toBe(false);
  });
});

// ============================================================================
// Workflow Trigger
// ============================================================================

describe('WorkflowTriggerTypeSchema', () => {
  it('accepts valid trigger types', () => {
    expect(WorkflowTriggerTypeSchema.safeParse('manual').success).toBe(true);
    expect(WorkflowTriggerTypeSchema.safeParse('schedule').success).toBe(true);
    expect(WorkflowTriggerTypeSchema.safeParse('webhook').success).toBe(true);
    expect(WorkflowTriggerTypeSchema.safeParse('event').success).toBe(true);
  });

  it('rejects invalid trigger types', () => {
    expect(WorkflowTriggerTypeSchema.safeParse('invalid').success).toBe(false);
    expect(WorkflowTriggerTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('ScheduleConfigSchema', () => {
  it('accepts valid schedule config', () => {
    const result = ScheduleConfigSchema.safeParse({
      cron: '0 9 * * 1-5',
      timezone: 'America/New_York',
      enabled: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts minimal schedule config', () => {
    const result = ScheduleConfigSchema.safeParse({
      cron: '0 * * * *',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enabled).toBe(true);
    }
  });

  it('rejects empty cron', () => {
    const result = ScheduleConfigSchema.safeParse({ cron: '' });
    expect(result.success).toBe(false);
  });
});

describe('WebhookConfigSchema', () => {
  it('accepts valid webhook config', () => {
    const result = WebhookConfigSchema.safeParse({
      events: ['push', 'pull_request'],
      secret: 'webhook-secret-123',
      filter: '$.action == "opened"',
    });
    expect(result.success).toBe(true);
  });

  it('requires at least one event', () => {
    const result = WebhookConfigSchema.safeParse({
      events: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('EventConfigSchema', () => {
  it('accepts valid event config', () => {
    const result = EventConfigSchema.safeParse({
      eventType: 'deployment.completed',
      filter: '$.environment == "production"',
    });
    expect(result.success).toBe(true);
  });

  it('requires eventType', () => {
    const result = EventConfigSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('ManualConfigSchema', () => {
  it('accepts valid manual config', () => {
    const result = ManualConfigSchema.safeParse({
      confirmationMessage: 'Are you sure you want to deploy?',
      promptForInputs: false,
    });
    expect(result.success).toBe(true);
  });

  it('provides default promptForInputs', () => {
    const result = ManualConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.promptForInputs).toBe(true);
    }
  });
});

describe('WorkflowTriggerSchema', () => {
  it('accepts manual trigger', () => {
    const result = WorkflowTriggerSchema.safeParse({
      type: 'manual',
      config: { promptForInputs: true },
    });
    expect(result.success).toBe(true);
  });

  it('accepts schedule trigger', () => {
    const result = WorkflowTriggerSchema.safeParse({
      type: 'schedule',
      config: { cron: '0 9 * * *', enabled: true },
    });
    expect(result.success).toBe(true);
  });

  it('accepts webhook trigger', () => {
    const result = WorkflowTriggerSchema.safeParse({
      type: 'webhook',
      config: { events: ['push'] },
    });
    expect(result.success).toBe(true);
  });

  it('accepts event trigger', () => {
    const result = WorkflowTriggerSchema.safeParse({
      type: 'event',
      config: { eventType: 'build.completed' },
    });
    expect(result.success).toBe(true);
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = WorkflowTrigger.V1.safeParse({
        type: 'manual',
        config: {},
      });
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = WorkflowTrigger.getVersion('v1');
      const result = schema.safeParse({
        type: 'manual',
        config: {},
      });
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(WorkflowTrigger.Latest).toBe(WorkflowTrigger.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseWorkflowTrigger returns valid trigger', () => {
      const trigger = parseWorkflowTrigger({
        type: 'manual',
        config: {},
      });
      expect(trigger.type).toBe('manual');
    });

    it('parseWorkflowTrigger throws on invalid data', () => {
      expect(() => parseWorkflowTrigger({})).toThrow();
    });

    it('safeParseWorkflowTrigger returns success result', () => {
      const result = safeParseWorkflowTrigger({
        type: 'manual',
        config: {},
      });
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// Workflow Step
// ============================================================================

describe('WorkflowStepTypeSchema', () => {
  it('accepts valid step types', () => {
    expect(WorkflowStepTypeSchema.safeParse('action').success).toBe(true);
    expect(WorkflowStepTypeSchema.safeParse('condition').success).toBe(true);
    expect(WorkflowStepTypeSchema.safeParse('loop').success).toBe(true);
    expect(WorkflowStepTypeSchema.safeParse('parallel').success).toBe(true);
    expect(WorkflowStepTypeSchema.safeParse('wait').success).toBe(true);
    expect(WorkflowStepTypeSchema.safeParse('subprocess').success).toBe(true);
  });

  it('rejects invalid step types', () => {
    expect(WorkflowStepTypeSchema.safeParse('invalid').success).toBe(false);
  });
});

describe('OnErrorStrategySchema', () => {
  it('accepts valid error strategies', () => {
    expect(OnErrorStrategySchema.safeParse('fail').success).toBe(true);
    expect(OnErrorStrategySchema.safeParse('continue').success).toBe(true);
    expect(OnErrorStrategySchema.safeParse('retry').success).toBe(true);
    expect(OnErrorStrategySchema.safeParse('skip').success).toBe(true);
  });
});

describe('RetryConfigSchema', () => {
  it('accepts valid retry config', () => {
    const result = RetryConfigSchema.safeParse({
      maxAttempts: 5,
      initialDelayMs: 2000,
      backoffMultiplier: 2,
      maxDelayMs: 30000,
    });
    expect(result.success).toBe(true);
  });

  it('provides defaults', () => {
    const result = RetryConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxAttempts).toBe(3);
      expect(result.data.initialDelayMs).toBe(1000);
      expect(result.data.backoffMultiplier).toBe(2);
      expect(result.data.maxDelayMs).toBe(60000);
    }
  });

  it('validates maxAttempts range', () => {
    expect(RetryConfigSchema.safeParse({ maxAttempts: 0 }).success).toBe(false);
    expect(RetryConfigSchema.safeParse({ maxAttempts: 11 }).success).toBe(false);
  });
});

describe('StepBranchSchema', () => {
  it('accepts valid branch config', () => {
    const result = StepBranchSchema.safeParse({
      name: 'success-path',
      condition: '$.status == "success"',
      steps: ['01ARZ3NDEKTSV4RRFFQ69G5FAV'],
    });
    expect(result.success).toBe(true);
  });

  it('requires at least one step', () => {
    const result = StepBranchSchema.safeParse({
      name: 'empty-branch',
      condition: 'true',
      steps: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('WorkflowStepSchema', () => {
  const validStep = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    name: 'Build application',
    type: 'action',
    action: 'build.run',
    inputs: { source: './src' },
  };

  it('accepts valid action step', () => {
    const result = WorkflowStepSchema.safeParse(validStep);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Build application');
      expect(result.data.type).toBe('action');
      expect(result.data.onError).toBe('fail'); // default
    }
  });

  it('accepts step with retry config', () => {
    const stepWithRetry = {
      ...validStep,
      onError: 'retry',
      retryConfig: {
        maxAttempts: 5,
        initialDelayMs: 1000,
      },
    };
    const result = WorkflowStepSchema.safeParse(stepWithRetry);
    expect(result.success).toBe(true);
  });

  it('accepts conditional step with branches', () => {
    const conditionalStep = {
      id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      name: 'Check status',
      type: 'condition',
      condition: '$.result != null',
      branches: [
        {
          name: 'success',
          condition: '$.result.status == "success"',
          steps: ['01ARZ3NDEKTSV4RRFFQ69G5FAW'],
        },
        {
          name: 'failure',
          condition: '$.result.status == "failed"',
          steps: ['01ARZ3NDEKTSV4RRFFQ69G5FAX'],
        },
      ],
    };
    const result = WorkflowStepSchema.safeParse(conditionalStep);
    expect(result.success).toBe(true);
  });

  it('accepts step with dependencies', () => {
    const stepWithDeps = {
      ...validStep,
      dependsOn: ['01ARZ3NDEKTSV4RRFFQ69G5FAW', '01ARZ3NDEKTSV4RRFFQ69G5FAX'],
    };
    const result = WorkflowStepSchema.safeParse(stepWithDeps);
    expect(result.success).toBe(true);
  });

  it('accepts step with timeout', () => {
    const stepWithTimeout = {
      ...validStep,
      timeoutMs: 30000,
    };
    const result = WorkflowStepSchema.safeParse(stepWithTimeout);
    expect(result.success).toBe(true);
  });

  it('rejects step without name', () => {
    const result = WorkflowStepSchema.safeParse({
      ...validStep,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = WorkflowStep.V1.safeParse(validStep);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = WorkflowStep.getVersion('v1');
      const result = schema.safeParse(validStep);
      expect(result.success).toBe(true);
    });
  });

  describe('parse helpers', () => {
    it('parseWorkflowStep returns valid step', () => {
      const step = parseWorkflowStep(validStep);
      expect(step.id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    });

    it('safeParseWorkflowStep returns success result', () => {
      const result = safeParseWorkflowStep(validStep);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// Workflow Parameter
// ============================================================================

describe('ParameterTypeSchema', () => {
  it('accepts valid parameter types', () => {
    expect(ParameterTypeSchema.safeParse('string').success).toBe(true);
    expect(ParameterTypeSchema.safeParse('number').success).toBe(true);
    expect(ParameterTypeSchema.safeParse('boolean').success).toBe(true);
    expect(ParameterTypeSchema.safeParse('array').success).toBe(true);
    expect(ParameterTypeSchema.safeParse('object').success).toBe(true);
  });
});

describe('WorkflowParameterSchema', () => {
  it('accepts valid parameter', () => {
    const result = WorkflowParameterSchema.safeParse({
      name: 'environment',
      type: 'string',
      description: 'Target deployment environment',
      required: true,
      defaultValue: 'staging',
    });
    expect(result.success).toBe(true);
  });

  it('provides default required value', () => {
    const result = WorkflowParameterSchema.safeParse({
      name: 'debug',
      type: 'boolean',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.required).toBe(true);
    }
  });

  it('accepts complex schema', () => {
    const result = WorkflowParameterSchema.safeParse({
      name: 'config',
      type: 'object',
      schema: {
        type: 'object',
        properties: {
          port: { type: 'number' },
          host: { type: 'string' },
        },
      },
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Workflow Definition
// ============================================================================

describe('WorkflowDefinitionSchema', () => {
  const validWorkflow = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    name: 'Deploy to Production',
    version: '1.0.0',
    description: 'Deploys the application to production environment',
    triggers: [
      { type: 'manual', config: { promptForInputs: true } },
    ],
    steps: [
      {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
        name: 'Build',
        type: 'action',
        action: 'build.run',
      },
      {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
        name: 'Deploy',
        type: 'action',
        action: 'deploy.run',
        dependsOn: ['01ARZ3NDEKTSV4RRFFQ69G5FAW'],
      },
    ],
    inputs: [
      { name: 'environment', type: 'string', required: true },
    ],
    outputs: [
      { name: 'deploymentUrl', type: 'string', required: false },
    ],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  };

  describe('valid workflows', () => {
    it('accepts valid workflow definition', () => {
      const result = WorkflowDefinitionSchema.safeParse(validWorkflow);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Deploy to Production');
        expect(result.data.version).toBe('1.0.0');
        expect(result.data.steps.length).toBe(2);
        expect(result.data.enabled).toBe(true); // default
      }
    });

    it('accepts workflow with multiple triggers', () => {
      const workflow = {
        ...validWorkflow,
        triggers: [
          { type: 'manual', config: {} },
          { type: 'schedule', config: { cron: '0 9 * * 1-5' } },
          { type: 'webhook', config: { events: ['push'] } },
        ],
      };
      const result = WorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(true);
    });

    it('accepts workflow with tags', () => {
      const workflow = {
        ...validWorkflow,
        tags: ['production', 'deployment', 'critical'],
      };
      const result = WorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(true);
    });

    it('accepts workflow with owner info', () => {
      const workflow = {
        ...validWorkflow,
        ownerId: 'user-123',
        organizationId: 'org-456',
      };
      const result = WorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(true);
    });

    it('accepts workflow with disabled state', () => {
      const workflow = {
        ...validWorkflow,
        enabled: false,
      };
      const result = WorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(false);
      }
    });
  });

  describe('validation rules', () => {
    it('requires at least one trigger', () => {
      const workflow = {
        ...validWorkflow,
        triggers: [],
      };
      const result = WorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(false);
    });

    it('requires at least one step', () => {
      const workflow = {
        ...validWorkflow,
        steps: [],
      };
      const result = WorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(false);
    });

    it('validates step ID uniqueness', () => {
      const workflow = {
        ...validWorkflow,
        steps: [
          { id: '01ARZ3NDEKTSV4RRFFQ69G5FAW', name: 'Step 1', type: 'action' },
          { id: '01ARZ3NDEKTSV4RRFFQ69G5FAW', name: 'Step 2', type: 'action' }, // duplicate
        ],
      };
      const result = WorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Step IDs must be unique');
      }
    });

    it('validates input parameter name uniqueness', () => {
      const workflow = {
        ...validWorkflow,
        inputs: [
          { name: 'env', type: 'string' },
          { name: 'env', type: 'string' }, // duplicate
        ],
      };
      const result = WorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Input parameter names must be unique');
      }
    });

    it('validates output parameter name uniqueness', () => {
      const workflow = {
        ...validWorkflow,
        outputs: [
          { name: 'url', type: 'string' },
          { name: 'url', type: 'string' }, // duplicate
        ],
      };
      const result = WorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Output parameter names must be unique');
      }
    });

    it('validates workflow name length', () => {
      const workflow = {
        ...validWorkflow,
        name: 'a'.repeat(101), // too long
      };
      const result = WorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(false);
    });

    it('rejects empty workflow name', () => {
      const workflow = {
        ...validWorkflow,
        name: '',
      };
      const result = WorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = WorkflowDefinition.V1.safeParse(validWorkflow);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = WorkflowDefinition.getVersion('v1');
      const result = schema.safeParse(validWorkflow);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(WorkflowDefinition.Latest).toBe(WorkflowDefinition.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseWorkflowDefinition returns valid definition', () => {
      const workflow = parseWorkflowDefinition(validWorkflow);
      expect(workflow.id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    });

    it('parseWorkflowDefinition throws on invalid data', () => {
      expect(() => parseWorkflowDefinition({})).toThrow();
    });

    it('safeParseWorkflowDefinition returns success result', () => {
      const result = safeParseWorkflowDefinition(validWorkflow);
      expect(result.success).toBe(true);
    });

    it('safeParseWorkflowDefinition returns failure result', () => {
      const result = safeParseWorkflowDefinition({});
      expect(result.success).toBe(false);
    });
  });
});
