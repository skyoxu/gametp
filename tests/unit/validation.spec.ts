import { describe, it, expect } from 'vitest';
import {
  ensureString,
  ensureBoolean,
  ensurePlainObject,
  sanitizeChannel,
} from '../../src/shared/contracts/validation';

describe('validation (lightweight placeholders)', () => {
  it('ensureString works', () => {
    expect(ensureString('ok', 'x')).toBe('ok');
    expect(() => ensureString(123 as unknown as string, 'x')).toThrow();
  });
  it('ensureBoolean works', () => {
    expect(ensureBoolean(true, 'b')).toBe(true);
    expect(() => ensureBoolean('no' as unknown as boolean, 'b')).toThrow();
  });
  it('ensurePlainObject works', () => {
    expect(ensurePlainObject({ a: 1 }, 'o')).toEqual({ a: 1 });
    expect(() => ensurePlainObject(null as unknown as object, 'o')).toThrow();
    expect(() => ensurePlainObject([] as unknown as object, 'o')).toThrow();
  });
  it('sanitizeChannel enforces pattern', () => {
    expect(sanitizeChannel('app:window:bring-to-front')).toBe(
      'app:window:bring-to-front'
    );
    expect(() => sanitizeChannel('Bad Space')).toThrow();
  });
});
