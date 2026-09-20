/*
 * 1. Relative path: site/src/lib/content/schema.ts
 * 2. Description: Strict Zod schemas for knowledge entry frontmatter and statistical chart data.
 * 3. Expects: Raw YAML frontmatter objects parsed from markdown files.
 * 4. Provides: Validated, strictly typed frontmatter interfaces. Build fails on schema violation.
 */
import { z } from 'zod';

export const ChartDataPointSchema = z.object({
  label: z.string().min(1),
  value: z.number().nonnegative()
});

export const KnowledgeEntryFrontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  publishedDate: z.coerce.date(),
  author: z.string().min(1),
  abstract: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1),
  chartData: z.array(ChartDataPointSchema).optional()
});

export type KnowledgeEntryFrontmatter = z.infer<typeof KnowledgeEntryFrontmatterSchema>;
export type ChartDataPoint = z.infer<typeof ChartDataPointSchema>;