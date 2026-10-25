// 1. Relative path: src/models/huggingface.ts
// 2. Description: HuggingFace API metadata pre-fetch and ingress logic with robust URL parsing and strict error narrowing.
// 3. Expects: A valid HuggingFace repository URL or ID, and an optional auth token.
// 4. Provides: Strictly typed HuggingFaceMetadata and safe, encoded URL fetching.
// 5. SPDX-License-Identifier: MPL-2.0
// 6. Copyright (c) 2026 Homahuki GmbH

export interface HuggingFaceFile {
  readonly rfilename: string;
  readonly sizeBytes: number | null;
}

export interface HuggingFaceMetadata {
  readonly repoId: string;
  readonly sanitizedModelId: string;
  readonly pipelineTag: string | null;
  readonly tags: ReadonlyArray<string>;
  readonly files: ReadonlyArray<HuggingFaceFile>;
  readonly totalSizeBytes: number;
  readonly isSizeAccurate: boolean;
}

/**
 * Parses a HuggingFace URL or raw repo ID into a clean, validated repo ID.
 * Strips trailing slashes and validates the "owner/repo" format.
 */
export function parseHuggingFaceUrl(input: string): string {
  const trimmed = input.trim();
  
  // Match standard HF URLs: https://huggingface.co/owner/repo or hf.co/owner/repo
  const urlMatch = trimmed.match(/(?:huggingface\.co|hf\.co)\/([^\/\s]+\/[^\/\s]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].replace(/\/+$/, '');
  }
  
  // If it's already a repo ID (e.g., "owner/repo"), validate and clean it
  const idMatch = trimmed.match(/^([^\/\s]+\/[^\/\s]+)$/);
  if (idMatch && idMatch[1]) {
    return idMatch[1].replace(/\/+$/, '');
  }
  
  throw new Error('Invalid HuggingFace URL or repository ID. Expected format: "owner/repo" or "https://huggingface.co/owner/repo"');
}

export function sanitizeModelId(repoId: string): string {
  return repoId.replace(/\//g, '--').replace(/[^a-zA-Z0-9\-_.]/g, '');
}

export async function fetchHuggingFaceMetadata(
  input: string,
  token?: string
): Promise<HuggingFaceMetadata> {
  const repoId = parseHuggingFaceUrl(input);
  
  const headers: HeadersInit = {
    'Accept': 'application/json',
    // HuggingFace aggressively blocks default Node.js fetch agents. We must identify ourselves.
    'User-Agent': 'SwISD-Model-Ingest/1.0 (https://github.com/homahuki/swisd)',
  };
  
  if (token && token.trim().length > 0) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  // CRITICAL: The HuggingFace API expects the literal slash in the URL path.
  // Do NOT use encodeURIComponent here, or the API will reject the "%2F" as an invalid repo name.
  const modelUrl = `https://huggingface.co/api/models/${repoId}`;
  
  const modelResponse = await fetch(modelUrl, { headers });
  
  if (!modelResponse.ok) {
    // Narrow unknown: extract the exact error payload from HuggingFace to eliminate guesswork
    const errorText = await modelResponse.text().catch(() => 'Unknown error');
    throw new Error(`HuggingFace API returned status ${modelResponse.status} for ${repoId}: ${errorText}`);
  }

  const modelData = (await modelResponse.json()) as {
    id: string;
    pipeline_tag?: string | null;
    tags?: string[];
    siblings?: { rfilename: string; size?: number }[];
  };

  const files: HuggingFaceFile[] = (modelData.siblings || []).map((sibling) => ({
    rfilename: sibling.rfilename,
    sizeBytes: sibling.size ?? null,
  }));

  const totalSizeBytes = files.reduce((sum, file) => sum + (file.sizeBytes ?? 0), 0);
  const isSizeAccurate = files.length > 0 && files.every((file) => file.sizeBytes !== null);

  return {
    repoId: modelData.id || repoId,
    sanitizedModelId: sanitizeModelId(modelData.id || repoId),
    pipelineTag: modelData.pipeline_tag ?? null,
    tags: modelData.tags ?? [],
    files,
    totalSizeBytes,
    isSizeAccurate,
  };
}