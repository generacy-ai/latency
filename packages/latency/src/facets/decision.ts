/**
 * Abstract interface for decision-making workflows.
 *
 * The {@link DecisionHandler} facet models any scenario where a system needs
 * to present a decision to a human (or external authority) and wait for a
 * result. Concrete implementations might target:
 *
 * - **Architecture Decision Records (ADRs)** — proposing and recording
 *   technical design choices with full rationale.
 * - **Approval workflows** — gating deployments, releases, or access changes
 *   behind explicit human sign-off.
 * - **Human-in-the-loop AI decisions** — pausing an autonomous agent to let
 *   a human choose between alternative plans or confirm a risky action.
 * - **Incident response** — escalating time-sensitive choices (rollback vs.
 *   forward-fix) with urgency levels and deadlines.
 *
 * All operations are async-first and return Promises.
 *
 * @module decision
 */

/**
 * Urgency level for a decision request.
 *
 * Implementations may use urgency to control notification channels,
 * escalation timers, or UI prominence.
 *
 * - `'low'` — No time pressure; decide when convenient.
 * - `'medium'` — Should be addressed in a reasonable timeframe.
 * - `'high'` — Requires prompt attention; may block progress.
 * - `'critical'` — Immediate action needed; may trigger escalation.
 */
export type Urgency = 'low' | 'medium' | 'high' | 'critical';

/**
 * A single option that can be selected when resolving a decision.
 *
 * @example
 * ```typescript
 * const option: DecisionOption = {
 *   label: 'PostgreSQL',
 *   description: 'Use PostgreSQL for relational data storage',
 *   metadata: { estimatedMigrationHours: 8 },
 * };
 * ```
 */
export interface DecisionOption {
  /** Short display label for this option. */
  label: string;

  /** Optional longer explanation of what this option entails. */
  description?: string;

  /** Arbitrary key-value metadata attached to this option. */
  metadata?: Record<string, unknown>;
}

/**
 * Input specification for creating a new decision request.
 *
 * @example
 * ```typescript
 * const spec: DecisionSpec = {
 *   title: 'Choose primary database',
 *   description: 'Select the database engine for the user service.',
 *   options: [
 *     { label: 'PostgreSQL', description: 'Relational, ACID-compliant' },
 *     { label: 'DynamoDB', description: 'Managed NoSQL, pay-per-request' },
 *   ],
 *   urgency: 'medium',
 *   deadline: new Date('2025-06-01'),
 * };
 * ```
 */
export interface DecisionSpec {
  /** Short title summarising the decision to be made. */
  title: string;

  /** Detailed description providing context for the decision. */
  description: string;

  /** Available options to choose from. */
  options: DecisionOption[];

  /** How urgently this decision needs to be resolved. */
  urgency: Urgency;

  /** Optional deadline by which the decision should be made. */
  deadline?: Date;
}

/**
 * The outcome of a resolved decision.
 *
 * @example
 * ```typescript
 * const result: DecisionResult = {
 *   selectedOption: 'PostgreSQL',
 *   rationale: 'Team has existing expertise and we need ACID guarantees.',
 *   decidedBy: 'alice@example.com',
 * };
 * ```
 */
export interface DecisionResult {
  /** The label of the selected option. */
  selectedOption: string;

  /** Optional explanation of why this option was chosen. */
  rationale?: string;

  /** Identifier of the person or entity that made the decision. */
  decidedBy: string;
}

/**
 * A decision record, combining the original request with its current status
 * and optional resolution.
 *
 * @example
 * ```typescript
 * const decision: Decision = {
 *   id: 'dec-001',
 *   title: 'Choose primary database',
 *   description: 'Select the database engine for the user service.',
 *   options: [
 *     { label: 'PostgreSQL' },
 *     { label: 'DynamoDB' },
 *   ],
 *   urgency: 'medium',
 *   status: 'resolved',
 *   result: {
 *     selectedOption: 'PostgreSQL',
 *     rationale: 'ACID guarantees required.',
 *     decidedBy: 'alice@example.com',
 *   },
 *   createdAt: new Date('2025-05-20'),
 *   resolvedAt: new Date('2025-05-22'),
 * };
 * ```
 */
export interface Decision {
  /** Unique identifier for this decision. */
  id: string;

  /** Short title summarising the decision. */
  title: string;

  /** Detailed description providing context for the decision. */
  description: string;

  /** Available options to choose from. */
  options: DecisionOption[];

  /** How urgently this decision needs to be resolved. */
  urgency: Urgency;

  /** Optional deadline by which the decision should be made. */
  deadline?: Date;

  /** The resolution result, present only when status is `'resolved'`. */
  result?: DecisionResult;

  /** Current status of the decision. */
  status: 'pending' | 'resolved';

  /** Timestamp when the decision request was created. */
  createdAt: Date;

  /** Timestamp when the decision was resolved, if applicable. */
  resolvedAt?: Date;
}

/**
 * Abstract interface for presenting decisions to humans and recording results.
 *
 * Implementations connect to external decision-tracking systems such as
 * GitHub Discussions, Slack workflows, custom approval UIs, or ADR
 * repositories.
 *
 * @remarks
 * **Adoption Status**: This interface is defined and stable, but currently awaiting
 * consumer adoption in Phase 3. See `facets/README.md` for the full facet maturity matrix.
 *
 * @example
 * ```typescript
 * // Request a decision and later resolve it
 * const decision = await handler.requestDecision({
 *   title: 'Approve production deploy',
 *   description: 'v2.3.0 is ready — approve or defer?',
 *   options: [
 *     { label: 'Approve' },
 *     { label: 'Defer', description: 'Wait until next maintenance window' },
 *   ],
 *   urgency: 'high',
 * });
 *
 * // ... later, when the decision is made ...
 * const resolved = await handler.resolveDecision(decision.id, {
 *   selectedOption: 'Approve',
 *   rationale: 'All checks green, stakeholders notified.',
 *   decidedBy: 'release-manager@example.com',
 * });
 * ```
 */
export interface DecisionHandler {
  /**
   * Present a new decision request for human resolution.
   *
   * Creates a pending decision from the given specification and notifies
   * the appropriate audience based on the urgency level.
   *
   * @param spec - The decision specification describing what needs to be decided.
   * @returns The newly created decision in `'pending'` status.
   */
  requestDecision(spec: DecisionSpec): Promise<Decision>;

  /**
   * Retrieve a decision by its unique identifier.
   *
   * @param id - The decision identifier.
   * @returns The decision record.
   * @throws {FacetError} With code `'NOT_FOUND'` if the decision does not exist.
   */
  getDecision(id: string): Promise<Decision>;

  /**
   * Record the outcome of a pending decision.
   *
   * Transitions the decision from `'pending'` to `'resolved'` and attaches
   * the provided result.
   *
   * @param id - The decision identifier.
   * @param result - The resolution details including the selected option and rationale.
   * @returns The updated decision with status `'resolved'`.
   * @throws {FacetError} With code `'NOT_FOUND'` if the decision does not exist.
   * @throws {FacetError} With code `'CONFLICT'` if the decision is already resolved.
   */
  resolveDecision(id: string, result: DecisionResult): Promise<Decision>;

  /**
   * List all decisions that have not yet been resolved.
   *
   * Returns decisions in `'pending'` status, typically ordered by urgency
   * (most urgent first) then by creation date.
   *
   * @returns An array of pending decisions.
   */
  listPendingDecisions(): Promise<Decision[]>;
}
