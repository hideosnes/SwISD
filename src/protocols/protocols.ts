// src/protocols/protocols.ts
// Protocol IDs for libp2p stream handlers (legacy fallback)
export const PROTOCOLS = {
  SWARM: '/swisd/0.0.1',
  ROLE_ASSIGNMENT: '/swisd/role/0.0.1',
  ROLE_REQUEST: '/swisd/role-request/0.0.1',
  ROLE_ANNOUNCEMENT: '/swisd/role-announce/0.0.1',
  INPUT_CAPABILITY: '/swisd/input-cap/0.0.1',
  TTS_REQUEST: '/swisd/tts/0.0.1',
  TASK_DELEGATION: '/swisd/task/0.0.1'
} as const

// GossipSub topic namespaces for pub/sub messaging
export const TOPICS = {
  CAPABILITY: 'swisd:capability',
  HEALTH: 'swisd:health',
  TASK_ANNOUNCE: 'swisd:task:announce',
  TASK_RESULT: 'swisd:task:result',
  REPUTATION: 'swisd:reputation'
} as const