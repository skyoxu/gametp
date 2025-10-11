/**
 * PVE/Raid module contracts
 * @description PRD-GM-PRD-GUILD-MANAGER_CHUNK_002 TypeScript contracts
 */

import type { CloudEvent } from './cloudevents-core';
import { mkEvent } from './cloudevents-core';
import type { IRepository, Port, Id } from './ports';

// ============================================================================
//
// ============================================================================

export enum RaidType {
  SMALL_DUNGEON = 'small_dungeon', // 5
  MEDIUM_DUNGEON = 'medium_dungeon', // 10
  LARGE_DUNGEON = 'large_dungeon', // 25
  RAID_INSTANCE = 'raid_instance', // 40
  MEGA_RAID = 'mega_raid', // 50
}

export enum DifficultyLevel {
  NORMAL = 'normal',
  HEROIC = 'heroic',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum RaidRole {
  MAIN_TANK = 'main_tank',
  OFF_TANK = 'off_tank',
  MELEE_DPS = 'melee_dps',
  RANGED_DPS = 'ranged_dps',
  MAIN_HEALER = 'main_healer',
  BACKUP_HEALER = 'backup_healer',
  UTILITY = 'utility',
}

export enum ReadinessLevel {
  DRAFT = 'draft',
  INCOMPLETE = 'incomplete',
  READY = 'ready',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum SlotPriority {
  REQUIRED = 'required',
  PREFERRED = 'preferred',
  OPTIONAL = 'optional',
}

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

// ============================================================================
//
// ============================================================================

/**
 * Raid dungeon definition
 */
export interface RaidDungeon {
  id: Id;
  name: string;
  type: RaidType;
  difficulty: DifficultyLevel;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: number; //
  lootTable: RaidReward[];
  bossEncounters: BossEncounter[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Raid reward item definition
 */
export interface RaidReward {
  itemId: Id;
  itemName: string;
  rarity: ItemRarity;
  dropChance: number; // 0-1
  itemLevel: number;
  stats: Record<string, number>;
  requirements: ItemRequirement[];
}

/**
 * Boss encounter definition
 */
export interface BossEncounter {
  encounterId: Id;
  name: string;
  phase: number;
  requiredRoles: RaidRole[];
  mechanics: string[];
  difficultyModifier: number;
}

/**
 * Item requirement
 */
export interface ItemRequirement {
  type: 'level' | 'class' | 'achievement';
  value: string | number;
  description: string;
}

/**
 * Raid composition definition
 */
export interface RaidComposition {
  id: Id;
  compositionId: Id;
  name: string;
  raidType: RaidType;
  maxMembers: number;
  roles: {
    tanks: RaidMemberSlot[];
    dps: RaidMemberSlot[];
    healers: RaidMemberSlot[];
  };
  currentMemberCount: number;
  readinessLevel: ReadinessLevel;
  guildId: Id;
  createdBy: Id;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 *
 */
export interface RaidMemberSlot {
  slotId: Id;
  assignedMember?: Id;
  requiredRole: RaidRole;
  priority: SlotPriority;
  isRequired: boolean;
  isLocked: boolean;
  aiRecommendation?: Id;
  assignedAt?: string;
}

/**
 *
 */
export interface MemberStats {
  memberId: Id;
  characterClass: string;
  itemLevel: number;
  raidExperience: number; // 0-100
  performanceScore: number; // 0-100
  availability: AvailabilityStatus;
  preferredRoles: RaidRole[];
  lastRaidDate?: string;
}

/**
 *
 */
export interface AvailabilityStatus {
  isOnline: boolean;
  isAvailable: boolean;
  unavailableUntil?: string;
  timezone: string;
}

/**
 *
 */
export interface CombatSimulation {
  id: Id;
  simulationId: Id;
  raidComposition: RaidComposition;
  targetDungeon: RaidDungeon;
  memberStats: MemberStats[];
  tacticModifiers: TacticEffect[];
  predictedOutcome: CombatResult;
  confidenceScore: number; // 0-1
  readonly createdAt: Date;
  readonly updatedAt: Date;
  simulationTimeMs: number;
}

/**
 *
 */
export interface TacticEffect {
  effectId: Id;
  name: string;
  type: 'buff' | 'debuff' | 'neutral';
  magnitude: number;
  duration?: number;
  applicableRoles: RaidRole[];
}

/**
 *
 */
export interface CombatResult {
  successProbability: number; // 0-1
  estimatedWipeCount: number;
  averageClearTime: number; //
  keyRisks: string[];
  strengthAreas: string[];
  recommendations: string[];
}

// ============================================================================
// / DTO
// ============================================================================

/**
 *
 */
export interface CreateRaidCompositionRequest {
  name: string;
  raidType: RaidType;
  guildId: Id;
  maxMembers?: number;
  templateId?: Id;
}

/**
 * AI
 */
export interface AssignmentPreferences {
  prioritizeExperience: boolean;
  prioritizeItemLevel: boolean;
  allowRoleFlexibility: boolean;
  preferredMembers?: Id[];
  excludedMembers?: Id[];
}

/**
 *
 */
export interface AssignmentResult {
  success: boolean;
  assignedCount: number;
  unassignedSlots: Id[];
  conflicts: AssignmentConflict[];
  recommendations: string[];
  processingTimeMs: number;
}

/**
 *
 */
export interface AssignmentConflict {
  slotId: Id;
  conflictType: 'role_mismatch' | 'availability' | 'item_level' | 'experience';
  description: string;
  suggestedResolution: string;
}

/**
 *
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
}

/**
 *
 */
export interface ValidationError {
  code: string;
  message: string;
  field: string;
  severity: 'error' | 'warning';
}

/**
 *
 */
export interface ValidationWarning {
  code: string;
  message: string;
  suggestion: string;
}

/**
 *
 */
export interface OptimizationCriteria {
  targetDungeon?: Id;
  priorityWeights: {
    successProbability: number;
    clearTime: number;
    memberSatisfaction: number;
    resourceEfficiency: number;
  };
  constraints: OptimizationConstraint[];
}

/**
 *
 */
export interface OptimizationConstraint {
  type: 'member_count' | 'role_distribution' | 'item_level' | 'experience';
  minValue?: number;
  maxValue?: number;
  exactValue?: number;
}

/**
 *
 */
export interface CompositionOptimization {
  optimizedComposition: RaidComposition;
  improvements: OptimizationImprovement[];
  estimatedGain: number; //
  confidence: number; // 0-1
}

/**
 *
 */
export interface OptimizationImprovement {
  type: 'role_swap' | 'member_replace' | 'slot_adjustment';
  description: string;
  expectedImpact: number;
  priority: 'high' | 'medium' | 'low';
}

/**
 *
 */
export interface TacticalReport {
  compositionId: Id;
  overallRating: number; // 0-100
  strengthsAnalysis: string[];
  weaknessesAnalysis: string[];
  recommendations: TacticalRecommendation[];
  comparedCompositions?: CompositionComparison[];
  generatedAt: string;
}

/**
 *
 */
export interface TacticalRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'composition' | 'tactics' | 'preparation' | 'equipment';
  description: string;
  expectedBenefit: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 *
 */
export interface CompositionComparison {
  comparedCompositionId: Id;
  comparedCompositionName: string;
  scoreDifference: number;
  keyDifferences: string[];
}

// ============================================================================
//  (CloudEvents 1.0)
// ============================================================================

/**
 * (CloudEvents 1.0)
 */
export type RaidDomainEventType =
  | 'io.vitegame.gm.raid.composition.created'
  | 'io.vitegame.gm.raid.composition.updated'
  | 'io.vitegame.gm.raid.composition.deleted'
  | 'io.vitegame.gm.raid.member.assigned'
  | 'io.vitegame.gm.raid.member.removed'
  | 'io.vitegame.gm.raid.simulation.started'
  | 'io.vitegame.gm.raid.simulation.completed'
  | 'io.vitegame.gm.raid.schedule.created'
  | 'io.vitegame.gm.raid.schedule.updated';

/**
 * (CloudEvents 1.0)
 */
export type TacticalCenterEventType =
  | 'io.vitegame.gm.tactical.ai.assignment.started'
  | 'io.vitegame.gm.tactical.ai.assignment.completed'
  | 'io.vitegame.gm.tactical.composition.validated'
  | 'io.vitegame.gm.tactical.composition.optimized';

/**
 *
 */
export interface RaidCompositionCreatedData {
  compositionId: Id;
  raidType: RaidType;
  createdBy: Id;
  guildId: Id;
  timestamp: string;
  memberSlots: number;
}

/**
 *
 */
export interface CombatSimulationCompletedData {
  simulationId: Id;
  compositionId: Id;
  dungeonId: Id;
  result: {
    successProbability: number;
    estimatedWipeCount: number;
    keyRisks: string[];
  };
  performance: {
    simulationTimeMs: number;
    accuracy: number;
  };
}

/**
 * AI
 */
export interface AIAssignmentCompletedData {
  compositionId: Id;
  assignmentResult: AssignmentResult;
  requestedBy: Id;
  preferences?: AssignmentPreferences;
  timestamp: string;
}

// ============================================================================
// Repository
// ============================================================================

/**
 *  Repository
 */
export interface IRaidRepository extends IRepository<RaidDungeon, Id> {
  findByType(raidType: RaidType): Promise<RaidDungeon[]>;
  findByDifficulty(difficulty: DifficultyLevel): Promise<RaidDungeon[]>;
  findByPlayerCount(
    minPlayers: number,
    maxPlayers: number
  ): Promise<RaidDungeon[]>;
}

/**
 *  Repository
 */
export interface IRaidCompositionRepository
  extends IRepository<RaidComposition, Id> {
  findByGuildId(guildId: Id): Promise<RaidComposition[]>;
  findByRaidType(raidType: RaidType): Promise<RaidComposition[]>;
  findActiveCompositions(): Promise<RaidComposition[]>;
  updateMemberAssignment(
    compositionId: Id,
    slotId: Id,
    memberId: Id
  ): Promise<void>;
  findByCreator(creatorId: Id): Promise<RaidComposition[]>;
}

/**
 *  Repository
 */
export interface ICombatSimulationRepository
  extends IRepository<CombatSimulation, Id> {
  findByComposition(compositionId: Id): Promise<CombatSimulation[]>;
  findRecentSimulations(limit: number): Promise<CombatSimulation[]>;
  saveSimulationResult(simulation: CombatSimulation): Promise<void>;
  findByDungeon(dungeonId: Id): Promise<CombatSimulation[]>;
}

// ============================================================================
//
// ============================================================================

/**
 *
 */
export interface IRaidManagementService extends Port {
  createRaidComposition(
    request: CreateRaidCompositionRequest
  ): Promise<RaidComposition>;
  assignMemberToRole(
    compositionId: Id,
    memberId: Id,
    role: RaidRole
  ): Promise<void>;
  autoAssignMembers(
    compositionId: Id,
    preferences?: AssignmentPreferences
  ): Promise<AssignmentResult>;
  validateComposition(compositionId: Id): Promise<ValidationResult>;
  removeComposition(compositionId: Id): Promise<void>;
  duplicateComposition(
    compositionId: Id,
    newName: string
  ): Promise<RaidComposition>;
}

/**
 * Tactical center service interface
 */
export interface ITacticalCenterService extends Port {
  simulateCombat(compositionId: Id, dungeonId: Id): Promise<CombatSimulation>;
  optimizeComposition(
    compositionId: Id,
    criteria: OptimizationCriteria
  ): Promise<CompositionOptimization>;
  generateTacticalReport(compositionId: Id): Promise<TacticalReport>;
  compareCompositions(compositionIds: Id[]): Promise<CompositionComparison[]>;
}

// ============================================================================
//
// ============================================================================

export const RAID_EVENT_SOURCES = {
  RAID_MANAGEMENT: 'io.vitegame.gm://raid-management',
  TACTICAL_CENTER: 'io.vitegame.gm://tactical-center',
  COMBAT_SIMULATOR: 'io.vitegame.gm://combat-simulator',
  AI_ASSIGNMENT: 'io.vitegame.gm://ai-assignment',
} as const;

// ============================================================================
// SLO
// ============================================================================

export const GUILD_MANAGER_CHUNK_002_SLOS = {
  RAID_UI_P95_MS: 100,
  COMBAT_SIM_P95_MS: 200,
  AI_ASSIGNMENT_P95_MS: 500,
  COMPOSITION_SAVE_P95_MS: 50,
  COMPOSITION_SUCCESS_RATE: 0.98,
  AI_ASSIGNMENT_ACCURACY: 0.85,
  SIMULATION_CONFIDENCE: 0.8,
} as const;

/**
 *
 */
export function isValidRaidType(value: string): value is RaidType {
  return Object.values(RaidType).includes(value as RaidType);
}

export function isValidRaidRole(value: string): value is RaidRole {
  return Object.values(RaidRole).includes(value as RaidRole);
}

export function isValidDifficultyLevel(
  value: string
): value is DifficultyLevel {
  return Object.values(DifficultyLevel).includes(value as DifficultyLevel);
}

/**
 *
 */
export const RAID_TYPE_CAPACITY: Record<
  RaidType,
  { min: number; max: number }
> = {
  [RaidType.SMALL_DUNGEON]: { min: 3, max: 5 },
  [RaidType.MEDIUM_DUNGEON]: { min: 5, max: 10 },
  [RaidType.LARGE_DUNGEON]: { min: 15, max: 25 },
  [RaidType.RAID_INSTANCE]: { min: 25, max: 40 },
  [RaidType.MEGA_RAID]: { min: 35, max: 50 },
};

/**
 *
 */
export const ROLE_DISTRIBUTION_GUIDE: Record<
  RaidType,
  { tanks: number; healers: number; dps: number }
> = {
  [RaidType.SMALL_DUNGEON]: { tanks: 1, healers: 1, dps: 3 },
  [RaidType.MEDIUM_DUNGEON]: { tanks: 2, healers: 2, dps: 6 },
  [RaidType.LARGE_DUNGEON]: { tanks: 3, healers: 5, dps: 17 },
  [RaidType.RAID_INSTANCE]: { tanks: 4, healers: 8, dps: 28 },
  [RaidType.MEGA_RAID]: { tanks: 5, healers: 10, dps: 35 },
};

// ============================================================================
// CloudEvents 1.0
// ============================================================================

/** Event type union */
export type RaidManagerEventType =
  | RaidDomainEventType
  | TacticalCenterEventType;

/** CloudEvent type for Raid Manager */
export type RaidManagerCloudEvent<T = any> = CloudEvent<T> & {
  type: RaidManagerEventType;
  source: (typeof RAID_EVENT_SOURCES)[keyof typeof RAID_EVENT_SOURCES];
};

/** CloudEvent factory */
export const createRaidEvent = <T>(
  type: RaidManagerEventType,
  source: keyof typeof RAID_EVENT_SOURCES,
  data: T,
  options: {
    compositionId?: Id;
    guildId?: Id;
    subject?: string;
  } = {}
): RaidManagerCloudEvent<T> => {
  return mkEvent({
    type,
    source: RAID_EVENT_SOURCES[source],
    data,
    subject:
      options.subject ||
      options.compositionId?.toString() ||
      options.guildId?.toString(),
    datacontenttype: 'application/json',
  }) as RaidManagerCloudEvent<T>;
};

/** Concrete event type aliases */
export type RaidCompositionCreatedEvent =
  RaidManagerCloudEvent<RaidCompositionCreatedData>;
export type CombatSimulationCompletedEvent =
  RaidManagerCloudEvent<CombatSimulationCompletedData>;
export type AIAssignmentCompletedEvent =
  RaidManagerCloudEvent<AIAssignmentCompletedData>;
