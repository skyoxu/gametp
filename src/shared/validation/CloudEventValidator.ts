/**
 * CloudEvents 1.0
 * Note
 */

import type { CloudEvent } from '../contracts/cloudevents-core';
import type { GuildManagerEventType } from '../contracts/guild-manager-chunk-001';

interface CloudEventValidationError {
  field: string;
  message: string;
  received?: unknown;
}

export class CloudEventValidator {
  private static readonly REQUIRED_FIELDS: (keyof CloudEvent)[] = [
    'specversion',
    'id',
    'source',
    'type',
  ];

  private static readonly VALID_SPEC_VERSION = '1.0';

  private static readonly GUILD_MANAGER_EVENT_TYPES: GuildManagerEventType[] = [
    'io.vitegame.gm.guild.turn.started',
    'io.vitegame.gm.guild.turn.phase_changed',
    'io.vitegame.gm.guild.turn.completed',
    'io.vitegame.gm.member.state_changed',
    'io.vitegame.gm.member.relationship_updated',
    'io.vitegame.gm.decision.created',
    'io.vitegame.gm.decision.resolved',
    'io.vitegame.gm.event.triggered',
    'io.vitegame.gm.ai.action_executed',
    'io.vitegame.gm.workpanel.data_updated',
  ];

  /**
   * CloudEvent 1.0
   */
  static validate(event: unknown): {
    isValid: boolean;
    errors: CloudEventValidationError[];
  } {
    const errors: CloudEventValidationError[] = [];

    if (!event || typeof event !== 'object') {
      return {
        isValid: false,
        errors: [
          {
            field: 'root',
            message: 'Event must be an object',
            received: event,
          },
        ],
      };
    }

    const cloudEvent = event as Partial<CloudEvent>;

    // Note
    for (const field of this.REQUIRED_FIELDS) {
      if (!cloudEvent[field]) {
        errors.push({
          field,
          message: `Required field '${field}' is missing`,
          received: cloudEvent[field],
        });
      }
    }

    // Validate specversion
    if (
      cloudEvent.specversion &&
      cloudEvent.specversion !== this.VALID_SPEC_VERSION
    ) {
      errors.push({
        field: 'specversion',
        message: `Invalid spec version. Expected '${this.VALID_SPEC_VERSION}'`,
        received: cloudEvent.specversion,
      });
    }

    // Note
    if (
      cloudEvent.type &&
      !this.GUILD_MANAGER_EVENT_TYPES.includes(
        cloudEvent.type as GuildManagerEventType
      )
    ) {
      errors.push({
        field: 'type',
        message: `Unknown event type. Must be one of: ${this.GUILD_MANAGER_EVENT_TYPES.join(', ')}`,
        received: cloudEvent.type,
      });
    }

    // Validate source format
    if (cloudEvent.source && !this.isValidSource(cloudEvent.source)) {
      errors.push({
        field: 'source',
        message: 'Invalid source format. Must be a valid URI',
        received: cloudEvent.source,
      });
    }

    // Note
    if (cloudEvent.time && !this.isValidTimestamp(cloudEvent.time)) {
      errors.push({
        field: 'time',
        message: 'Invalid timestamp format. Must be RFC 3339',
        received: cloudEvent.time,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * source
   */
  private static isValidSource(source: string): boolean {
    try {
      new URL(source);
      return true;
    } catch {
      // Allow URI-reference format (e.g., "gm://turn-system")
      return /^[a-z][a-z0-9+.-]*:\/\/[\w-]+$/.test(source);
    }
  }

  /**
   * (RFC 3339)
   */
  private static isValidTimestamp(time: string): boolean {
    const rfc3339Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!rfc3339Regex.test(time)) return false;

    const date = new Date(time);
    return !isNaN(date.getTime());
  }

  /**
   * CloudEvent
   */
  static createEvent(
    type: GuildManagerEventType,
    source: string,
    data?: unknown,
    options?: {
      id?: string;
      time?: string;
      subject?: string;
      datacontenttype?: string;
    }
  ): CloudEvent {
    return {
      specversion: this.VALID_SPEC_VERSION,
      id: options?.id || this.generateId(),
      source,
      type,
      time: options?.time || new Date().toISOString(),
      ...(data && { data }),
      ...(options?.subject && { subject: options.subject }),
      ...(options?.datacontenttype && {
        datacontenttype: options.datacontenttype,
      }),
    };
  }

  /**
   * ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Note
   */
  static validateEventHandler<T extends CloudEvent>(
    handler: (event: T) => Promise<unknown>
  ) {
    return async (event: unknown): Promise<unknown> => {
      const validation = this.validate(event);

      if (!validation.isValid) {
        const errorMsg = validation.errors
          .map(err => `${err.field}: ${err.message}`)
          .join('; ');
        throw new Error(`CloudEvent validation failed: ${errorMsg}`);
      }

      return handler(event as T);
    };
  }
}

// Note
export function isValidCloudEvent(event: unknown): event is CloudEvent {
  return CloudEventValidator.validate(event).isValid;
}
