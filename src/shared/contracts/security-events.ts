/**
 * Note
 * Electron
 */

export type SecurityEvent =
  | { type: 'NAV_BLOCKED'; url: string }
  | { type: 'POPUP_BLOCKED'; url: string };

/**
 * Note
 */
export type SecurityEventHandler = (event: SecurityEvent) => void;

/**
 * Note
 */
export interface SecurityEventEmitter {
  emit(event: SecurityEvent): void;
  on(handler: SecurityEventHandler): void;
  off(handler: SecurityEventHandler): void;
}
