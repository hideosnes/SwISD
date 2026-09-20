/*
 * 1. Relative path: site/src/lib/content/types.ts
 * 2. Description: Strict TypeScript interfaces for knowledge entry metadata and full content.
 * 3. Expects: Validated frontmatter and parsed HTML strings.
 * 4. Provides: Exhaustive DTOs for the research hub routes.
 */
import type { KnowledgeEntryFrontmatter } from './schema';

export interface KnowledgeEntryMeta extends KnowledgeEntryFrontmatter {
  // Extends frontmatter. Slug is guaranteed to be present and validated.
}

export interface KnowledgeEntry extends KnowledgeEntryMeta {
  contentHtml: string;
}