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

const modules = import.meta.glob('./knowledge/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

function parseKnowledgeEntry(id: string, raw: string): KnowledgeEntry {
  const { data, content } = matter(raw);
  const frontmatter = KnowledgeEntryFrontmatterSchema.parse(data);

  const fileSlug = id.split('/').pop()?.replace('.md', '') ?? '';
  if (frontmatter.slug !== fileSlug) {
    throw new Error(`Slug mismatch in ${id}: frontmatter says '${frontmatter.slug}', file is '${fileSlug}'`);
  }

  let contentHtml = marked.parse(content, { async: false }) as string;

  // 1. Aggressively strip the first heading block (h1 or h2) to prevent header duplication
  contentHtml = contentHtml.replace(/^<h[12][^>]*>[\s\S]*?<\/h[12]>\s*/i, '');

  // 2. Convert [1], [2], etc. to normal lime citation links (NO sup, NO underline)
  contentHtml = contentHtml.replace(/\[(\d+)\]/g, '<a href="#ref-$1" class="knowledge-citation" aria-label="Jump to reference $1">$1</a>');

  // 3. Inject sequential IDs into the reference list items AND format external links
  contentHtml = contentHtml.replace(/(<h[234]>References<\/h[234]>[\s\S]*?<ol>)([\s\S]*?)(<\/ol>)/i, (match: string, before: string, listItems: string, after: string) => {
    let index = 1;
    const newItems = listItems.replace(/<li>([\s\S]*?)<\/li>/gi, (_liMatch: string, listItemContent: string) => {
      let formattedContent = listItemContent;
      
      // Strategy 1: Replace a standard Markdown-rendered <a> tag at the end of the line
      formattedContent = formattedContent.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>.*?<\/a>\s*$/i, 
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="citation-link"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="citation-arrow" aria-hidden="true"><path d="M7 17L17 7M17 7H8M17 7V16"></path></svg></a>'
      );
      
      // Strategy 2: If no <a> tag was found, look for a bare URL at the end of the line
      if (formattedContent === listItemContent) {
        formattedContent = formattedContent.replace(/(https?:\/\/[^\s<]+)\s*$/i, 
          '<a href="$1" target="_blank" rel="noopener noreferrer" class="citation-link"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="citation-arrow" aria-hidden="true"><path d="M7 17L17 7M17 7H8M17 7V16"></path></svg></a>'
        );
      }
      
      return `<li id="ref-${index++}">${formattedContent}</li>`;
    });
    return before + newItems + after;
  });

  return {
    ...frontmatter,
    contentHtml
  };
}

export function loadAllKnowledgeEntries(): KnowledgeEntryMeta[] {
  return Object.entries(modules)
    .map(([id, raw]) => {
      const full = parseKnowledgeEntry(id, raw);
      const { contentHtml, ...meta } = full;
      return meta;
    })
    .sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime());
}

export function loadKnowledgeEntryBySlug(slug: string): KnowledgeEntry | undefined {
  const entry = Object.entries(modules).find(([id]) => id.endsWith(`/${slug}.md`));
  if (!entry) return undefined;
  
  return parseKnowledgeEntry(entry[0], entry[1]);
}