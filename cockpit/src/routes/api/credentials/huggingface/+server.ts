// 1. Relative path: cockpit/src/routes/api/credentials/huggingface/+server.ts
// 2. Description: BFF endpoint to validate and persist the HuggingFace API token.
// 3. Expects: A JSON payload with the `token` string.
// 4. Provides: Validation result and persistence confirmation.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json() as unknown;
  
  if (typeof body !== 'object' || body === null || !('token' in body) || typeof (body as Record<string, unknown>).token !== 'string') {
    throw error(400, 'Invalid payload. Expected { token: string }.');
  }

  const token = (body as Record<string, unknown>).token as string;
  
  if (!locals.credentialManager) {
    throw error(500, 'CredentialManager not initialized in BFF locals.');
  }

  const validation = await locals.credentialManager.validateHuggingFaceToken(token);
  
  if (!validation.valid) {
    return json({ valid: false, error: validation.error }, { status: 400 });
  }

  await locals.credentialManager.saveHuggingFaceToken(token);
  
  return json({ 
    valid: true, 
    username: validation.username,
    message: 'Token validated and saved securely.' 
  });
};

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.credentialManager) {
    throw error(500, 'CredentialManager not initialized in BFF locals.');
  }
  
  const token = locals.credentialManager.getHuggingFaceToken();
  return json({ 
    configured: !!token,
    // Never return the actual token to the client!
    masked: token ? `${token.slice(0, 4)}...${token.slice(-4)}` : null 
  });
};