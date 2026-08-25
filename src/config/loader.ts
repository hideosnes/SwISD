// src/config/loader.ts
// Description: Loads and validates the SwISD configuration from the USB provision file or environment.
// Expects: Filesystem access to `/swisd-provision.json` or valid `SWISD_*` environment variables.
// Provides: A fully validated, immutable `ProvisionConfig` object for the application runtime.

import { readFileSync, existsSync } from 'node:fs';
import { safeJsonParse } from '../utils.js';
import { isProvisionConfig, ProvisionConfig } from './schema.js';
import { SwISDError } from '../errors.js';

const PROVISION_PATH = '/swisd-provision.json';

/**
 * Loads the provision config. Prioritizes the USB stick, falls back to env vars for local dev.
 * @throws SwISDError if the configuration is missing or invalid.
 */
export function loadProvisionConfig(): ProvisionConfig {
  // 1. Check USB stick path (Production / Pi environment)
  if (existsSync(PROVISION_PATH)) {
    const raw = readFileSync(PROVISION_PATH, 'utf-8');
    try {
      return safeJsonParse(raw, isProvisionConfig);
    } catch (err) {
      throw new SwISDError(
        'ERR_INVALID_PROVISION_SCHEMA',
        'Failed to parse or validate /swisd-provision.json',
        err
      );
    }
  }

  // 2. Fallback to Environment Variables (Local Dev / Docker)
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    const envRole = process.env.SWISD_ROLE;
    if (envRole === 'auto' || envRole === 'input' || envRole === 'worker') {
      return {
        wifi: { ssid: 'DevNetwork', psk: 'DevPassword', country: 'DE' },
        role: envRole,
        modelSource: { type: 'hf', url: 'https://huggingface.co/dev/model' },
        version: 1,
      };
    }
  }

  throw new SwISDError(
    'ERR_INVALID_PROVISION_SCHEMA',
    `Provision file not found at ${PROVISION_PATH} and no valid development fallback provided.`
  );
}