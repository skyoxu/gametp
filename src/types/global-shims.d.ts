// Global and module shims for browser-safe TypeScript checks in shared code
// Note: These are minimal and intentionally permissive to keep strict configs
// without pulling full @types/node into DOM builds.

// Provide a very loose declaration for process.env so references compile
declare const process: {
  env?: Record<string, string | undefined>;
};

// Minimal EventEmitter surface used by our shared services without @types/node
declare module 'events' {
  export class EventEmitter {
    on(eventName: string | symbol, listener: (...args: any[]) => void): this;
    off(eventName: string | symbol, listener: (...args: any[]) => void): this;
    emit(eventName: string | symbol, ...args: any[]): boolean;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    listenerCount(eventName: string | symbol): number;
    eventNames(): Array<string | symbol>;
    removeAllListeners(eventName?: string | symbol): this;
  }
}
