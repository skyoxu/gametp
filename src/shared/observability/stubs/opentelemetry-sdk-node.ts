/**
 * No-op NodeSDK stub used when OpenTelemetry SDK packages are absent.
 */

interface NodeSdkOptions {
  resource?: unknown;
  spanProcessors?: unknown;
  instrumentations?: unknown;
}

export class NodeSDK {
  constructor(private readonly _options: NodeSdkOptions = {}) {}

  async start(): Promise<void> {
    return;
  }

  async shutdown(): Promise<void> {
    return;
  }
}
