/**
 * BatchSpanProcessor stub that performs no work but preserves API surface.
 */

export class BatchSpanProcessor {
  constructor(_exporter?: unknown) {
    void _exporter;
  }

  async forceFlush(): Promise<void> {
    return;
  }

  async shutdown(): Promise<void> {
    return;
  }
}
