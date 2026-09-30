/**
 * 1. Relative path: site/src/routes/sitemap.xml/+server.ts
 * 2. Description: Build-time sitemap generator for the SwISD marketing site.
 * 3. Expects: Static adapter prerendering; data from cases.ts and knowledge loader.
 * 4. Provides: A standards-compliant sitemap.xml generated at build time with zero external dependencies.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */
import { loadAllKnowledgeEntries } from '$lib/content/loader';
import { cases } from '$lib/content/cases';

// Explicitly command the static adapter to prerender this standalone API endpoint
export const prerender = true;

const BASE_URL = 'https://swisd.at';

interface SitemapEntry {
  readonly loc: string;
  readonly changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  readonly priority: string;
}

export async function GET(): Promise<Response> {
  const knowledgeEntries = loadAllKnowledgeEntries();

  // Public routes only. /design is internal and excluded.
  const entries: SitemapEntry[] = [
    { loc: '',                    changefreq: 'weekly',  priority: '1.0' },
    { loc: '/case-studies',       changefreq: 'weekly',  priority: '0.8' },
    { loc: '/research',           changefreq: 'weekly',  priority: '0.8' },
    { loc: '/roadmap',            changefreq: 'weekly',  priority: '0.8' },
    { loc: '/pricing',            changefreq: 'monthly', priority: '0.7' },
  ];

  for (const c of cases) {
    entries.push({
      loc: `/case-studies/${c.slug}`,
      changefreq: 'monthly',
      priority: '0.6',
    });
  }

  for (const e of knowledgeEntries) {
    entries.push({
      loc: `/research/${e.slug}`,
      changefreq: 'monthly',
      priority: '0.6',
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${BASE_URL}${entry.loc}</loc>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}