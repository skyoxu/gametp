/**
 * Minimal resource helper stub.
 */

export interface ResourceStub {
  attributes: Record<string, unknown>;
}

export function resourceFromAttributes(
  attributes: Record<string, unknown>
): ResourceStub {
  return { attributes: { ...attributes } };
}
