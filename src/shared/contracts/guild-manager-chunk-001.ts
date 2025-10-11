/**
 * Guild Manager PRD Chunk 1 - TypeScript contracts
 * Based on CloudEvents 1.0 and Ports & Adapters model
 */

import type { CloudEvent } from './cloudevents-core';
import { mkEvent, createAppEvent } from './cloudevents-core';
import type { IRepository, Port, Id } from './ports';

// === Core Type Definitions ===

export type GuildId = Id;
export type MemberId = Id;
export type TurnId = Id;
export type EventId = Id;
export type DecisionId = Id;

// === Enums ===

export enum TurnPhase {
  IDLE = 'idle',
  RESOLUTION = 'resolution',
  PLAYER = 'player',
  AI_SIMULATION = 'ai_simulation',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export enum MemberRole {
  MEMBER = 'member',
  OFFICER = 'officer',
  MASTER = 'master',
}

export enum MemberState {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CONFLICTED = 'conflicted',
  MOTIVATED = 'motivated',
  BURNOUT = 'burnout',
  TRAINING = 'training',
  INJURED = 'injured',
  ABSENT = 'absent',
  PROBATION = 'probation',
  RETIRING = 'retiring',
}

export enum GuildStatus {
  ACTIVE = 'active',
  RECRUITING = 'recruiting',
  LOCKED = 'locked',
  DISBANDED = 'disbanded',
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// === Core Entity Interfaces ===

export interface Guild {
  id: GuildId;
  name: string;
  level: number;
  reputation: number;
  resources: ResourceState;
  members: GuildMember[];
  currentTurn: number;
  status: GuildStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface GuildMember {
  id: MemberId;
  guildId: GuildId; // Add missing guild ID property
  name: string;
  level: number;
  role: MemberRole;
  personalityTraits: PersonalityTraits;
  relationships: RelationshipMap;
  currentState: MemberState;
  aiGoals: PersonalGoal[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface GameTurn {
  id: TurnId;
  guildId: GuildId; // Add missing guild ID property
  turnNumber: number; // Add missing turn number property
  weekNumber: number;
  currentPhase: TurnPhase;
  startedAt: string;
  phaseDeadlines: PhaseDeadlines;
  pendingDecisions: CriticalDecision[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// === Supporting Types ===

export interface ResourceState {
  gold: number;
  reputation: number;
  influence: number;
  materials: number;
}

export interface PersonalityTraits {
  ambition: number; // 0-100
  loyalty: number; // 0-100
  competitiveness: number; // 0-100
  sociability: number; // 0-100
  reliability: number; // 0-100
}

export interface RelationshipMap {
  [memberId: string]: {
    trust: number; // -100 to 100
    respect: number; // -100 to 100
    friendship: number; // -100 to 100
    lastInteraction: string;
  };
}

export interface PersonalGoal {
  id: string;
  description: string;
  priority: number;
  progress: number;
  deadline?: string;
}

export interface PhaseDeadlines {
  resolution?: string;
  player?: string;
  aiSimulation?: string;
}

export interface CriticalDecision {
  id: DecisionId;
  title: string;
  description: string;
  urgency: UrgencyLevel;
  deadline?: number;
  options: DecisionOption[];
  consequences: ConsequenceMap;
  autoResolve?: AutoResolveRule;
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  cost?: ResourceCost;
  requirements?: Requirement[];
}

export interface ConsequenceMap {
  [optionId: string]: {
    immediate: Effect[];
    delayed: DelayedEffect[];
    reputation: number;
    resources: Partial<ResourceState>;
  };
}

export interface AutoResolveRule {
  action: string;
  reason: string;
}

export interface ResourceCost {
  gold?: number;
  reputation?: number;
  influence?: number;
  materials?: number;
}

export interface Requirement {
  type: 'level' | 'resource' | 'relationship' | 'status';
  target?: string;
  value: number | string;
  operator: 'gte' | 'lte' | 'eq' | 'contains';
}

export interface Effect {
  type: 'resource' | 'state' | 'relationship' | 'buff';
  target: string;
  value: number | string;
  duration?: number;
}

export interface DelayedEffect extends Effect {
  delay: number;
  triggerConditions?: string[];
}

// === CloudEvents ===

export type GuildManagerEventType =
  | 'io.vitegame.gm.guild.turn.started'
  | 'io.vitegame.gm.guild.turn.phase_changed'
  | 'io.vitegame.gm.guild.turn.completed'
  | 'io.vitegame.gm.member.state_changed'
  | 'io.vitegame.gm.member.relationship_updated'
  | 'io.vitegame.gm.decision.created'
  | 'io.vitegame.gm.decision.resolved'
  | 'io.vitegame.gm.event.triggered'
  | 'io.vitegame.gm.ai.action_executed'
  | 'io.vitegame.gm.workpanel.data_updated';

export const GUILD_EVENT_SOURCES = {
  TURN_SYSTEM: 'io.vitegame.gm://turn-system',
  AI_ENGINE: 'io.vitegame.gm://ai-engine',
  WORK_PANEL: 'io.vitegame.gm://work-panel',
  MAILBOX: 'io.vitegame.gm://mailbox',
  MEMBER_MANAGER: 'io.vitegame.gm://member-manager',
} as const;

// === ===

export interface GuildTurnStartedData {
  guildId: GuildId;
  weekNumber: number;
  previousPhaseResults: PhaseResult[];
}

export interface MemberStateChangedData {
  memberId: MemberId;
  guildId: GuildId;
  previousState: MemberState;
  newState: MemberState;
  trigger: StateChangeTrigger;
}

export interface DecisionCreatedData {
  decisionId: DecisionId;
  guildId: GuildId;
  urgency: UrgencyLevel;
  deadline?: string;
}

export interface PhaseResult {
  phase: TurnPhase;
  duration: number;
  success: boolean;
  events: string[];
  changes: StateChange[];
}

export interface StateChangeTrigger {
  type: 'event' | 'ai_decision' | 'player_action' | 'time';
  source: string;
  reason: string;
}

// Note
export interface StateChange<T = any> {
  type: string;
  target: string;
  before: Partial<T>;
  after: Partial<T>;
}

// Note
export type GuildStateChange = StateChange<Guild>;
export type MemberStateChange = StateChange<GuildMember>;
export type TurnStateChange = StateChange<GameTurn>;

// === ===

export interface IGuildRepository extends IRepository<Guild, GuildId> {
  findByLevel(minLevel: number): Promise<Guild[]>;
  findByStatus(status: GuildStatus): Promise<Guild[]>;
  updateResources(id: GuildId, resources: ResourceState): Promise<void>;
  incrementTurn(id: GuildId): Promise<number>;
}

export interface IMemberRepository extends IRepository<GuildMember, MemberId> {
  findByGuildId(guildId: GuildId): Promise<GuildMember[]>;
  findByRole(role: MemberRole): Promise<GuildMember[]>;
  findByState(state: MemberState): Promise<GuildMember[]>;
  updateState(id: MemberId, newState: MemberState): Promise<void>;
  updateRelationships(
    id: MemberId,
    relationships: RelationshipMap
  ): Promise<void>;
}

export interface ITurnRepository extends IRepository<GameTurn, TurnId> {
  getCurrentTurn(guildId: GuildId): Promise<GameTurn | null>;
  findByPhase(phase: TurnPhase): Promise<GameTurn[]>;
  updatePhase(id: TurnId, newPhase: TurnPhase): Promise<void>;
}

// === ===

export interface IGuildManagementService extends Port {
  readonly portType: 'primary';

  // Note
  startNewTurn(guildId: GuildId): Promise<TurnStartResult>;
  executeResolutionPhase(turnId: TurnId): Promise<ResolutionResult>;
  advanceToPlayerPhase(turnId: TurnId): Promise<PlayerPhaseResult>;
  executeAIPhase(turnId: TurnId): Promise<AISimulationResult>;

  // Note
  getWorkPanelData(guildId: GuildId): Promise<WorkPanelData>;
  refreshGuildStats(guildId: GuildId): Promise<GuildStats>;

  // Note
  getMailboxEvents(guildId: GuildId): Promise<MailboxEvent[]>;
  processDecision(
    decisionId: DecisionId,
    choice: DecisionChoice
  ): Promise<DecisionResult>;

  // AI
  triggerMemberAI(memberId: MemberId): Promise<AIActionResult[]>;
  updateMemberRelationships(
    memberId: MemberId
  ): Promise<RelationshipUpdateResult>;
}

export interface IEventSystemService extends Port {
  readonly portType: 'primary';

  triggerEvent(eventId: EventId, context: EventContext): Promise<EventResult>;
  processEventQueue(guildId: GuildId): Promise<ProcessedEvent[]>;
  registerEventHandler(eventType: string, handler: EventHandler): void;
  getAvailableEvents(
    guildId: GuildId,
    filters: EventFilters
  ): Promise<GameEvent[]>;
}

// === ===

export interface TurnStartResult {
  turnId: TurnId;
  phase: TurnPhase;
  estimatedDuration: number;
  initialEvents: GameEvent[];
}

export interface ResolutionResult {
  processedEvents: number;
  stateChanges: StateChange[];
  newEvents: GameEvent[];
  duration: number;
}

export interface PlayerPhaseResult {
  availableActions: PlayerAction[];
  pendingDecisions: CriticalDecision[];
  deadline?: string;
}

export interface AISimulationResult {
  memberActions: MemberAIAction[];
  relationshipChanges: RelationshipUpdate[];
  newEvents: GameEvent[];
  duration: number;
}

export interface WorkPanelData {
  guild: Guild;
  recentEvents: GameEvent[];
  upcomingDeadlines: Deadline[];
  memberSummary: MemberSummary;
  resourceTrends: ResourceTrend[];
  lastUpdated: string;
}

export interface GuildStats {
  memberCount: number;
  averageLevel: number;
  totalReputation: number;
  activeMembers: number;
  recentPerformance: PerformanceMetric[];
}

export interface MailboxEvent {
  id: string;
  from: string;
  subject: string;
  body: string;
  urgency: UrgencyLevel;
  hasAttachment: boolean;
  relatedDecision?: DecisionId;
  receivedAt: string;
}

// Note
export type DecisionParameters =
  | { type: 'promotion'; memberId: MemberId; newRole: MemberRole }
  | { type: 'resource_allocation'; amounts: Partial<ResourceState> }
  | { type: 'policy_change'; policyId: string; value: boolean }
  | { type: 'custom'; [key: string]: string | number | boolean };

export interface DecisionChoice {
  decisionId: DecisionId;
  optionId: string;
  customParameters?: DecisionParameters;
}

export interface DecisionResult {
  success: boolean;
  immediateEffects: Effect[];
  scheduledEffects: DelayedEffect[];
  newEvents: GameEvent[];
  message: string;
}

export interface AIActionResult {
  memberId: MemberId;
  action: string;
  success: boolean;
  effects: Effect[];
  reasoning: string;
}

export interface RelationshipUpdateResult {
  memberId: MemberId;
  changes: RelationshipChange[];
  newConflicts: Conflict[];
  newAlliances: Alliance[];
}

// === ===

export interface PlayerAction {
  id: string;
  label: string;
  description: string;
  cost?: ResourceCost;
  cooldown?: number;
  requirements?: Requirement[];
}

// AI
export type AIActionParameters =
  | {
      type: 'social_interaction';
      targetMemberId: MemberId;
      interactionType: 'support' | 'conflict' | 'collaborate';
    }
  | { type: 'skill_training'; skillCategory: string; intensity: number }
  | {
      type: 'goal_pursuit';
      goalId: string;
      approach: 'aggressive' | 'cautious';
    }
  | {
      type: 'resource_request';
      resourceType: keyof ResourceState;
      amount: number;
    };

export interface MemberAIAction {
  memberId: MemberId;
  actionType: string;
  targetId?: string;
  parameters: AIActionParameters;
  reasoning: string;
  confidence: number;
}

export interface RelationshipUpdate {
  memberId1: MemberId;
  memberId2: MemberId;
  changes: {
    trust?: number;
    respect?: number;
    friendship?: number;
  };
  reason: string;
}

export interface Deadline {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: UrgencyLevel;
  relatedEntity?: string;
}

export interface MemberSummary {
  total: number;
  byRole: Record<MemberRole, number>;
  byState: Record<MemberState, number>;
  recentChanges: MemberStateChangeEvent[];
}

export interface MemberStateChangeEvent {
  memberId: MemberId;
  previousState: MemberState;
  newState: MemberState;
  timestamp: string;
  reason: string;
}

export interface ResourceTrend {
  resource: keyof ResourceState;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

export interface RelationshipChange {
  targetId: MemberId;
  relationship: keyof RelationshipMap[string];
  oldValue: number;
  newValue: number;
  change: number;
}

export interface Conflict {
  id: string;
  member1: MemberId;
  member2: MemberId;
  severity: number;
  type: string;
  description: string;
  startedAt: string;
}

export interface Alliance {
  id: string;
  members: MemberId[];
  strength: number;
  type: string;
  description: string;
  formedAt: string;
}

// === Event System Interfaces ===

// Event context parameter types
export type EventContextParameters =
  | { type: 'turn_event'; phase: TurnPhase; weekNumber: number }
  | { type: 'member_event'; memberId: MemberId; previousState?: MemberState }
  | { type: 'decision_event'; decisionId: DecisionId; urgency: UrgencyLevel }
  | { type: 'system_event'; [key: string]: string | number | boolean };

export interface EventContext {
  guildId: GuildId;
  triggeredBy?: string;
  parameters?: EventContextParameters;
  timestamp: string;
}

export interface EventResult {
  eventId: EventId;
  success: boolean;
  effects: Effect[];
  newEvents: GameEvent[];
  duration: number;
}

export interface ProcessedEvent {
  eventId: EventId;
  processedAt: string;
  result: EventResult;
}

export interface EventHandler {
  (event: CloudEvent, context: EventContext): Promise<EventResult>;
}

export interface EventFilters {
  category?: string[];
  urgency?: UrgencyLevel[];
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
}

export interface GameEvent {
  id: EventId;
  category: string;
  title: string;
  description: string;
  urgency: UrgencyLevel;
  triggeredAt: string;
  deadline?: string;
  participants: string[];
  status: 'pending' | 'active' | 'completed' | 'cancelled';
}

// === CloudEvents 1.0 ===

/** CloudEvent type for Guild Manager */
export type GuildManagerCloudEvent<T = any> = CloudEvent<T> & {
  type: GuildManagerEventType;
  source: (typeof GUILD_EVENT_SOURCES)[keyof typeof GUILD_EVENT_SOURCES];
};

/** CloudEvent factory - compliant with CloudEvents 1.0 */
export const createGuildEvent = <T>(
  type: GuildManagerEventType,
  source: keyof typeof GUILD_EVENT_SOURCES,
  data: T,
  options: {
    guildId?: GuildId;
    subject?: string;
  } = {}
): GuildManagerCloudEvent<T> => {
  return mkEvent({
    type,
    source: GUILD_EVENT_SOURCES[source],
    data,
    subject: options.subject || options.guildId?.toString(),
    datacontenttype: 'application/json',
  }) as GuildManagerCloudEvent<T>;
};

/** Concrete event type aliases */
export type GuildTurnStartedEvent =
  GuildManagerCloudEvent<GuildTurnStartedData>;
export type MemberStateChangedEvent =
  GuildManagerCloudEvent<MemberStateChangedData>;
export type DecisionCreatedEvent = GuildManagerCloudEvent<DecisionCreatedData>;

