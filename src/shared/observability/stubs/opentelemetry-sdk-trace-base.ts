/**
 * BatchSpanProcessor stub that performs no work but preserves API surface.
 */

export class BatchSpanProcessor {
  constructor(private readonly _exporter: unknown) {}

  async forceFlush(): Promise<void> {
    return;
  }

  async shutdown(): Promise<void> {
    return;
  }
}
