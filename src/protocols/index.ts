// src/protocols/index.ts
export { createNodeConfig } from './config/libp2pConfig.ts'

export { setupEventHandlers } from './connections/eventHandlers.ts'

export { setupProtocolHandler } from './connections/protocolHamdler.ts'

export { RoleAssignmentManager } from './discovery/roleAssignments.ts'

export { startHealthCheck } from './health/healthCheck.ts'