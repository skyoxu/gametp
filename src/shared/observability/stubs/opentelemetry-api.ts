/**
 * Minimal stub of the OpenTelemetry API so builds can succeed when the real
 * packages are not installed. Runtime code falls back to no-op spans.
 */

type SpanAttributes = Record<string, unknown>;

type SpanStatus = {
  code: SpanStatusCode;
  message?: string;
};

class NoopSpan {
  setStatus(_status: SpanStatus): void {}
  setAttributes(_attributes: SpanAttributes): void {}
  addEvent(_name: string, _attributes?: SpanAttributes): void {}
  recordException(_error: unknown): void {}
  end(): void {}
  spanContext(): { traceId: string; spanId: string; traceFlags: number } {
    return { traceId: 'noop-trace', spanId: 'noop-span', traceFlags: 0 };
  }
}

const activeSpan = new NoopSpan();

export enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

export enum SpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
}

export const trace = {
  getTracer(_name: string, _version?: string) {
    return {
      startSpan(_spanName: string, _options?: { kind?: SpanKind; attributes?: SpanAttributes; parentContext?: unknown }) {
        return new NoopSpan();
      },
    };
  },
  getActiveSpan() {
    return activeSpan;
  },
};

export const context = {
  active() {
    return {} as Record<string, unknown>;
  },
};

export type Span = NoopSpan;
