// 1. Relative path: src/executor/registry.ts
// 2. Description: Synchronous, in-memory registry of supported executor types for O(1) capability matching.
// 3. Expects: Executor type strings to be registered at startup or upon capability manifest updates.
// 4. Provides: Instant, non-blocking boolean checks for task routing without querying the CRDT layer.

export class ExecutorRegistry {
  private readonly supportedTypes = new Set<string>();

  public registerExecutor(type: string): void {
    this.supportedTypes.add(type);
  }

  public unregisterExecutor(type: string): void {
    this.supportedTypes.delete(type);
  }

  public supports(type: string): boolean {
    return this.supportedTypes.has(type);
  }

  public getSupportedExecutors(): ReadonlyArray<string> {
    return Array.from(this.supportedTypes);
  }

  public clear(): void {
    this.supportedTypes.clear();
  }
}