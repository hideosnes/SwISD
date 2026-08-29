// 1. Relative path: src/models/huggingface.ts
// 2. Description: HuggingFace metadata pre-fetcher. Queries the HF API for model size and file structure without downloading weights.
// 3. Expects: A valid HuggingFace URL or repo ID, and optional HF_ACCESS_TOKEN in process.env.
// 4. Provides: Strictly typed metadata to feed the Conductor Approval Gate modal.

import { SwISDError } from '../errors.js';

export interface HuggingFaceFileMetadata {
  readonly rfilename: string;
  readonly sizeBytes: number | null;
}

export interface HuggingFaceMetadata {
  readonly repoId: string;
  readonly sanitizedModelId: string;
  readonly pipelineTag: string | null;
  readonly tags: ReadonlyArray<string>;
  readonly files: ReadonlyArray<HuggingFaceFileMetadata>;
  readonly totalSizeBytes: number;
  readonly isSizeAccurate: boolean;
}

export function parseHuggingFaceUrl(urlOrRepoId: string): string {
  try {
    const parsed = new URL(urlOrRepoId);
    if (parsed.hostname === 'huggingface.co' || parsed.hostname.endsWith('.huggingface.co')) {
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      if (pathSegments.length >= 2) {
        return `${pathSegments[0]}/${pathSegments[1]}`;
      }
    }
  } catch {
    // Not a valid URL, assume it's already a repo ID
  }

  const segments = urlOrRepoId.split('/').filter(Boolean);
  if (segments.length !== 2) {
    throw new SwISDError('ERR_MODEL_METADATA_FETCH', `Invalid HuggingFace repo ID or URL: ${urlOrRepoId}`);
  }
  return `${segments[0]}/${segments[1]}`;
}

export function sanitizeModelId(repoId: string): string {
  return repoId.replace(/\//g, '--');
}

export async function fetchHuggingFaceMetadata(urlOrRepoId: string): Promise<HuggingFaceMetadata> {
  const repoId = parseHuggingFaceUrl(urlOrRepoId);
  const sanitizedModelId = sanitizeModelId(repoId);
  
  const apiUrl = `https://huggingface.co/api/models/${encodeURIComponent(repoId)}`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  const token = process.env.HF_ACCESS_TOKEN;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(10000) });
  } catch (error) {
    throw new SwISDError('ERR_MODEL_METADATA_FETCH', `Failed to reach HuggingFace API for ${repoId}`, error);
  }

  if (response.status === 404) {
    throw new SwISDError('ERR_MODEL_METADATA_FETCH', `Model ${repoId} not found on HuggingFace`);
  }
  
  if (response.status === 401 || response.status === 403) {
    throw new SwISDError('ERR_MODEL_METADATA_FETCH', `Access denied to ${repoId}. Check HF_ACCESS_TOKEN for gated models.`);
  }

  if (!response.ok) {
    throw new SwISDError('ERR_MODEL_METADATA_FETCH', `HuggingFace API returned status ${response.status} for ${repoId}`);
  }

  const data = await response.json() as unknown;
  return parseHfApiResponse(data, repoId, sanitizedModelId);
}

function parseHfApiResponse(data: unknown, repoId: string, sanitizedModelId: string): HuggingFaceMetadata {
  if (typeof data !== 'object' || data === null) {
    throw new SwISDError('ERR_MODEL_METADATA_FETCH', 'Invalid JSON response from HuggingFace API');
  }

  const obj = data as Record<string, unknown>;
  
  const siblings = obj.siblings;
  if (!Array.isArray(siblings)) {
    throw new SwISDError('ERR_MODEL_METADATA_FETCH', 'Missing siblings array in HuggingFace API response');
  }

  const files: HuggingFaceFileMetadata[] = [];
  let totalSizeBytes = 0;
  let isSizeAccurate = true;

  for (const sibling of siblings) {
    if (typeof sibling !== 'object' || sibling === null) continue;
    const sib = sibling as Record<string, unknown>;
    
    const rfilename = sib.rfilename;
    if (typeof rfilename !== 'string') continue;

    let sizeBytes: number | null = null;
    if (typeof sib.size === 'number' && Number.isFinite(sib.size)) {
      sizeBytes = sib.size;
      totalSizeBytes += sizeBytes;
    } else {
      // If any file is missing a size, the total is inaccurate (UI will show "Size unknown")
      isSizeAccurate = false;
    }

    files.push({ rfilename, sizeBytes });
  }

  const pipelineTag = typeof obj.pipeline_tag === 'string' ? obj.pipeline_tag : null;
  const tags = Array.isArray(obj.tags) ? obj.tags.filter((t): t is string => typeof t === 'string') : [];

  return {
    repoId,
    sanitizedModelId,
    pipelineTag,
    tags,
    files,
    totalSizeBytes,
    isSizeAccurate,
  };
}