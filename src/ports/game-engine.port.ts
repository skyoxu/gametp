/**
 * Game engine ports - layered architecture
 * Definitions for core DTOs and ports
 */

import type { DomainEvent } from '../shared/contracts/events';

/**
 * Game state interface
 */
/**
 * Core game state DTO
 */
export interface GameState {
  readonly id: string;
  readonly level: number;
  readonly score: number;
  readonly health: number;
  readonly inventory: string[];
  readonly position: Position;
  readonly timestamp: Date;
}

/**
 * Position (2D/optional Z)
 */
export interface Position {
  x: number;
  y: number;
  z?: number;
}

/**
 * Immutable game configuration DTO
 */
/**
 * Game configuration
 */
export interface GameConfig {
  readonly maxLevel: number;
  readonly initialHealth: number;
  readonly scoreMultiplier: number;
  readonly autoSave: boolean;
  readonly difficulty: 'easy' | 'medium' | 'hard';
  /**
   * Primary input port for the game engine
   * Adheres to ports-and-adapters (ADR-0007).
   */
}

/**
 * Game engine input port
 * External systems use this to operate the engine
 */
/**
 * Primary input port for the game engine
 * Adheres to ports-and-adapters (ADR-0007).
 */
export interface GameEnginePort {
  /**
   * Initialize game
   */
  initializeGame(config: GameConfig): Promise<GameState>;

  /**
   * Start game session
   */
  startGame(saveId?: string): Promise<GameState>;

  /**
   * Pause game
   */
  pauseGame(): Promise<void>;

  /**
   * Resume game
   */
  resumeGame(): Promise<void>;

  /**
   * Save game state
   */
  saveGame(): Promise<string>;

  /**
   * Load game state
   */
  loadGame(saveId: string): Promise<GameState>;

  /**
   * Handle user input
   */
  handleInput(input: GameInput): Promise<void>;

  /**
   * Get current game state
   */
  getCurrentState(): GameState;

  /**
   * Subscribe to game events
   */
  onGameEvent(callback: (event: DomainEvent) => void): void;

  /**
   * Unsubscribe from game events
   */
  offGameEvent(callback: (event: DomainEvent) => void): void;

  /**
   * End game
   */
  endGame(): Promise<GameResult>;
}

/**
 * Game input
 */
export interface GameInput {
  type: 'keyboard' | 'mouse' | 'touch' | 'gamepad';
  action: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Game result
 */
export interface GameResult {
  finalScore: number;
  levelReached: number;
  playTime: number;
  achievements: string[];
  statistics: GameStatistics;
}

/**
 * Game statistics
 */
export interface GameStatistics {
  totalMoves: number;
  /**
   * Output port for rendering/audio/persistence/network
   * Implementations adapt engine to external systems.
   */
  itemsCollected: number;
  enemiesDefeated: number;
  distanceTraveled: number;
  averageReactionTime: number;
}

/**
 * Game engine output port
 * Adapter-facing capabilities for rendering, I/O and events
 */
/**
 * Output port for rendering/audio/persistence/network
 * Implementations adapt engine to external systems.
 */
export interface GameEngineOutputPort {
  /**
   * Render frame
   */
  renderFrame(renderData: RenderData): Promise<void>;

  /**
   * Play audio
   */
  playAudio(audioData: AudioData): Promise<void>;

  /**
   * Save data to storage
   */
  saveData(key: string, data: unknown): Promise<void>;

  /**
   * Load data from storage
   */
  loadData(key: string): Promise<unknown>;

  /**
   * Send network request
   */
  sendNetworkRequest(request: NetworkRequest): Promise<NetworkResponse>;

  /**
   * Publish domain event
   */
  publishEvent(event: DomainEvent): Promise<void>;

  /**
   * Log message
   */
  logMessage(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, unknown>
  ): Promise<void>;
}

/**
 * Render data
 */
export interface RenderData {
  sprites: SpriteData[];
  ui: UIData[];
  effects: EffectData[];
  camera: CameraData;
}

/**
 * Sprite data
 */
export interface SpriteData {
  id: string;
  texture: string;
  position: Position;
  rotation: number;
  scale: { x: number; y: number };
  visible: boolean;
  opacity: number;
}

/**
 * UI
 */
export interface UIData {
  id: string;
  type: 'text' | 'button' | 'panel' | 'progress';
  position: Position;
  content: string | number;
  style: Record<string, unknown>;
}

/**
 * Effect data
 */
export interface EffectData {
  id: string;
  type: string;
  position: Position;
  duration: number;
  parameters: Record<string, unknown>;
}

/**
 * Camera data
 */
export interface CameraData {
  position: Position;
  zoom: number;
  rotation: number;
  followTarget?: string;
}

/**
 * Audio data
 */
export interface AudioData {
  id: string;
  type: 'sfx' | 'music' | 'voice';
  volume: number;
  loop: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

/**
 * Request
 */
export interface NetworkRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

/**
 * Response
 */
export interface NetworkResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}
