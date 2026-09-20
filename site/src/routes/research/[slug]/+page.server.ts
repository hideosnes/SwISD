/*
 * 1. Relative path: site/src/routes/research/[slug]/+page.server.ts
 * 2. Description: Server-side load function for individual knowledge entry detail views.
 * 3. Expects: SvelteKit PageServerLoad event with slug param.
 * 4. Provides: Full KnowledgeEntry DTO or throws 404.
 */
import { loadKnowledgeEntryBySlug } from '$lib/content';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const entry = loadKnowledgeEntryBySlug(params.slug);
  
  if (!entry) {
    throw error(404, 'Knowledge entry not found');
  }
  
  return { entry };
};