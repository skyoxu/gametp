/**
 * CloudEvents 1.0 core utilities (ADR-0004).
 * Minimal builder, validator, and types used by the event bus and IPC.
 * ASCII-only comments and messages.
 */

// Core interface (required fields)
export interface CeBase {
  id: string; // Unique event id
  source: string; // Event source (URI)
  type: string; // Event type (reverse DNS)
  specversion: '1.0'; // CloudEvents spec version (fixed)
  time: string; // ISO 8601 timestamp
}

// Complete CloudEvent (optional fields)
export interface CloudEvent<T = unknown> extends CeBase {
  data?: T; // Event payload
  datacontenttype?: string; // Content type
  dataschema?: string; // Data schema URI
  subject?: string; // Subject
}

/** Build a CloudEvent and auto-fill required fields */
export function mkEvent<T = unknown>(
  e: Omit<CeBase, 'id' | 'time' | 'specversion'> & {
    data?: T;
    datacontenttype?: string;
    dataschema?: string;
    subject?: string;
  }
): CloudEvent<T> {
  return {
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    specversion: '1.0',
    ...e,
  };
}

/** Runtime validator for CeBase */
export function assertCe(o: any): asserts o is CeBase {
  const required = ['id', 'source', 'type', 'specversion', 'time'];
  for (const field of required) {
    if (!o?.[field])
      throw new Error(`CloudEvent missing required field: ${field}`);
  }
  if (o.specversion !== '1.0') {
    throw new Error(
      `Unsupported CloudEvents specversion: ${o.specversion}, expected '1.0'`
    );
  }
  // Validate time (ISO 8601)
  if (typeof o.time === 'string' && isNaN(Date.parse(o.time))) {
    throw new Error(`Invalid time format: ${o.time}, expected ISO 8601`);
  }
  // Validate source (URI)
  if (typeof o.source === 'string' && !isValidUri(o.source)) {
    console.warn(`CloudEvent source should be a valid URI: ${o.source}`);
  }
}

/** Simple URI format check */
function isValidUri(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    // Fallback: scheme-only quick check
    return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(str);
  }
}

// App-level event types
export type AppEventType =
  | 'app.lifecycle.started'
  | 'app.lifecycle.stopped'
  | 'app.window.created'
  | 'app.window.closed'
  | 'game.scene.loaded'
  | 'game.scene.unloaded'
  | 'guild.member.joined'
  | 'guild.member.left';

// Event source identifiers
export const EVENT_SOURCES = {
  APP: 'app://vitegame/lifecycle',
  WINDOW: 'app://vitegame/window',
  GAME: 'app://vitegame/game-engine',
  GUILD: 'app://vitegame/guild-manager',
  IPC: 'ipc://vitegame/main-renderer',
} as const;

// Type-safe factory for app events
export function createAppEvent<T = unknown>(
  type: AppEventType,
  source: keyof typeof EVENT_SOURCES,
  data?: T,
  options?: { subject?: string; datacontenttype?: string }
): CloudEvent<T> {
  return mkEvent({ type, source: EVENT_SOURCES[source], data, ...options });
}

// Type guard: is CloudEvent
export function isCloudEvent(obj: unknown): obj is CloudEvent {
  try {
    assertCe(obj);
    return true;
  } catch {
    return false;
  }
}

// Type guard: specific app event
export function isAppEvent(event: CloudEvent, type: AppEventType): boolean {
  return event.type === type;
}

// Validate an array of events
export function validateEvents(events: unknown[]): CloudEvent[] {
  const validEvents: CloudEvent[] = [];
  const errors: string[] = [];
  events.forEach((event, index) => {
    try {
      assertCe(event);
      validEvents.push(event as CloudEvent);
    } catch (error) {
      errors.push(
        `Event ${index}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
  if (errors.length > 0)
    throw new Error(`Event validation failed:\n${errors.join('\n')}`);
  return validEvents;
}

// Serialize / deserialize helpers
export function serializeEvent(event: CloudEvent): string {
  assertCe(event);
  return JSON.stringify(event);
}

export function deserializeEvent<T = unknown>(json: string): CloudEvent<T> {
  const event = JSON.parse(json);
  assertCe(event);
  return event as CloudEvent<T>;
}
