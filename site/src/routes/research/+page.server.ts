/*
 * 1. Relative path: site/src/routes/research/+page.server.ts
 * 2. Description: Server-side load function for the research hub list view.
 * 3. Expects: SvelteKit PageServerLoad event.
 * 4. Provides: Strictly typed array of KnowledgeEntryMeta DTOs to the client.
 */
import { loadAllKnowledgeEntries } from '$lib/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  return {
    entries: loadAllKnowledgeEntries()
  };
};