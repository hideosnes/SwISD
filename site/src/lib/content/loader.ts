/*
 * 1. Relative path: site/src/lib/content/loader.ts
 * 2. Description: Build-time static content loader using Vite's import.meta.glob.
 * 3. Expects: Markdown files in the ./knowledge/ directory with valid YAML frontmatter.
 * 4. Provides: Strictly typed arrays of metadata and full knowledge entry objects. Zero Node fs bloat.
 */
import { KnowledgeEntryFrontmatterSchema } from './schema';
import type { KnowledgeEntryMeta, KnowledgeEntry } from './types';
import matter from 'gray-matter';
import { marked } from 'marked';

// Vite static import. Eagerly loads all .md files in the knowledge directory as raw strings at build time.
const modules = import.meta.glob('./knowledge/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

function parseKnowledgeEntry(id: string, raw: string): KnowledgeEntry {
  const { data, content } = matter(raw);
  const frontmatter = KnowledgeEntryFrontmatterSchema.parse(data);

  // Enforce slug matches filename to prevent routing mismatches
  const fileSlug = id.split('/').pop()?.replace('.md', '') ?? '';
  if (frontmatter.slug !== fileSlug) {
    throw new Error(`Slug mismatch in ${id}: frontmatter says '${frontmatter.slug}', file is '${fileSlug}'`);
  }

  // marked.parse returns string when async is false. We assert to satisfy TS.
  const contentHtml = marked.parse(content, { async: false }) as string;

  return {
    ...frontmatter,
    contentHtml
  };
}

export function loadAllKnowledgeEntries(): KnowledgeEntryMeta[] {
  return Object.entries(modules)
    .map(([id, raw]) => {
      try {
        const full = parseKnowledgeEntry(id, raw);
        const { contentHtml, ...meta } = full;
        return meta;
      } catch (e) {
        console.error(`Failed to parse knowledge entry ${id}:`, e);
        throw e; // Fail the build if schema is invalid
      }
    })
    .sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime());
}

export function loadKnowledgeEntryBySlug(slug: string): KnowledgeEntry | undefined {
  const entry = Object.entries(modules).find(([id]) => id.endsWith(`/${slug}.md`));
  if (!entry) return undefined;
  
  try {
    return parseKnowledgeEntry(entry[0], entry[1]);
  } catch (e) {
    console.error(`Failed to parse knowledge entry ${slug}:`, e);
    throw e;
  }
}