/**
 * Jaeger exporter stub that allows optional integration code to compile.
 */

interface JaegerExporterOptions {
  endpoint?: string;
}

export class JaegerExporter {
  constructor(private readonly _options: JaegerExporterOptions = {}) {}
}
