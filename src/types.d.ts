/**
 * 1. Relative path: src/types.d.ts
 * 2. Description: Global ambient type declarations augmenting Node.js and global scopes.
 * 3. Expects: Node.js global process environment and standard libp2p types.
 * 4. Provides: Strict typings for global variables, preventing implicit `any` in global scope.
 */

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly SWISD_VERSION: string;
    readonly SWISD_ROLE?: 'input' | 'worker' | 'diplomat' | 'auto';
    readonly SWISD_STATE_DIR?: string;
  }
}

// Prevent this file from being treated as a script, ensuring it acts as a module augmentation
export {};