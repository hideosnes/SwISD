// src/types.d.ts
// Description: Global ambient type declarations augmenting Node.js process environment.
// Expects: Node.js global process environment and standard runtime variables.
// Provides: Strict typings for global environment variables, preventing implicit unsafe globals.

export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      SWISD_VERSION?: string;
      SWISD_ROLE?: 'input' | 'worker' | 'diplomat' | 'auto';
      SWISD_STATE_DIR?: string;

      SWISD_ADMIN_HOST?: string;
      SWISD_ADMIN_PORT?: string;
      SWISD_ADMIN_TOKEN?: string;
      SWISD_ALLOW_LAN_ADMIN?: string;
      SWISD_ADMIN_CORS?: string;

      SWISD_DEV_PEER_ID?: string;
    }
  }
}