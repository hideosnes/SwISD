// src/tasks/capabilities.ts
// Description: Defines the Capability Manifest, allowing the swarm to route tasks based on software availability (executor modules), not just hardware.
// Expects: A registry of supported executor types and their current versions/hashes.
// Provides: A strictly typed interface for peers to advertise their software capabilities, enabling capability-aware routing in a blind topology.

export interface ExecutorSignature {
  readonly type: string;       // e.g., 'kokoro-tts', 'audio-analysis'
  readonly version: string;    // Semver string
  readonly moduleHash: string; // SHA-256 hash of the executor module for integrity
}

/**
 * The Capability Manifest. This is stored in the peer's LWW-Register in the Control Ledger.
 * It tells the swarm exactly what this peer can execute right now.
 */
export interface CapabilityManifest {
  readonly peerId: string;
  readonly availableMemoryBytes: number;
  readonly availableStorageBytes: number;
  readonly supportedExecutors: ReadonlyArray<ExecutorSignature>;
  readonly lastUpdated: number;
}

/**
 * Checks if a peer's manifest supports a specific executor type.
 * Used by the routing layer to filter out peers that would reject the task.
 */
export function peerSupportsExecutor(
  manifest: CapabilityManifest,
  requiredType: string
): boolean {
  return manifest.supportedExecutors.some(exec => exec.type === requiredType);
}