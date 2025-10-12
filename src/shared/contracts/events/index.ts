/**
 * Application event type definitions.
 * Naming convention: {DOMAIN_PREFIX}.<entity>.<action>
 */

import type { GameDomainEvent } from './GameEvents';

// Base event interface
export interface BaseEvent {
  type: string;
  data?: any;
  source?: string;
  timestamp?: Date;
  metadata?: {
    id?: string;
    priority?: number;
    persistent?: boolean;
    broadcast?: boolean;
  };
}

// System event type (simplified: no template literal constraints)
export interface SystemEvent extends BaseEvent {
  type: string;
}

// Application events
export type AppEvent =
  | { type: 'guild.create'; name: string }
  | { type: 'guild.rename'; id: string; name: string }
  | { type: 'inventory.add'; itemId: string; qty: number };

// Unite all domain events as BaseEvent to avoid type conflicts
export type DomainEvent = BaseEvent;

export type AppEventType = AppEvent['type'];

export type EventHandler<T extends DomainEvent = DomainEvent> = (
  e: T
) => void | Promise<void>;

// Type alias support
export type EventType = DomainEvent['type'];

// Re-export game events
export * from './GameEvents';
