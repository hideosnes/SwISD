/**
 * 1. Relative path: site/src/lib/content/cases.ts
 * 2. Description: Case study data source for the SwISD marketing site.
 * 3. Expects: Strictly typed case entries; asset imports from the assets barrel.
 * 4. Provides: The single source of truth for the case studies archive.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */
import {
  deepBackofficeArt, 
  deepHistoriesArt, 
  intelligentMicrophoneArt, 
  kupfBotArt, 
  retailAnalysisArt,
  ricaFuentesArt,
  biometricExpressionsArt,
  sundayInOsakaArt,
  voxerlArt,
  webxrArt,
  lindabrunnRagArt
} from '$lib/assets';

export type CaseIndustry = 'Arts & Culture' | 'Retail' | 'Healthcare' | 'Technology' | 'R&D' | 'Event' | 'Finance';
export type CaseModality = 'Image' | 'Audio' | 'Generative' | 'Text' | 'Classification' | 'Retrieval' | 'Recognition';

/** External links open in a new tab and use the external Arrow. */
export interface CaseHref {
  readonly href: string;
  readonly external?: boolean;
}

export interface CasePartner {
  readonly name: string;
  readonly link?: CaseHref;
}

/** Optional link turns the card title into a lime link. */
export interface CaseEntry {
  readonly slug: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly image: string;
  readonly year: number;
  readonly partners: readonly CasePartner[];
  readonly industry: readonly CaseIndustry[];
  readonly modalities: readonly CaseModality[];
  readonly summary: string;
  readonly link?: CaseHref;
}

const rawCases: CaseEntry[] = [
  {
    slug: 'tell-me-what-you-are-to-me',
    title: 'Tell me what you are to me',
    image: ricaFuentesArt,
    year: 2026,
    partners: [
      { name: 'Rica Fuentes', link: { href: 'https://ricafuentes.com', external: true } }
    ],
    industry: ['Arts & Culture'],
    modalities: ['Image', 'Audio'],
    summary: 'Rica Fuentes incorporates SwISD into her crochet sculptures, capturing visitor audio and transforming it within the live installation. SwISD analyzes images and audio inputs to create predictions, responding in audio so the swarm becomes a participant in the sculpture.'
  },
  {
    slug: 'deep-histories',
    title: 'Deep Histories',
    image: deepHistoriesArt,
    year: 2026,
    partners: [
      { name: 'Hidéo Snes', link: { href: 'https://hideosnes.online', external: true } }
    ],
    industry: ['Arts & Culture'],
    modalities: ['Image', 'Generative'],
    summary: 'Deep Histories runs image synthesis models, including FLUX with LoRA fine-tunes, across a global network of smart toilets and other smart devices. SwISD coordinates the distributed inference, turning ordinary consumer appliances into a decentralized render swarm that synthesizes images on demand.'
  },
  {
    slug: 'intelligent-microphone',
    title: 'Intelligent Microphone',
    image: intelligentMicrophoneArt,
    year: 2026,
    partners: [
      { name: 'Marius Schebella', link: { href: 'https://schebella.com', external: true } }
    ],
    industry: ['Technology'],
    modalities: ['Audio', 'Classification'],
    summary: 'Marius Schebella deploys a classifier-free audio model that uses CLIP to zero-shot classify whatever it hears. The swarm handles inference without predefined categories, outputting both text descriptions and audio responses, letting the model describe what it encounters in its own terms.'
  },
  {
    slug: 'retail-analysis',
    title: 'Retail Analysis',
    image: retailAnalysisArt,
    year: 2026,
    partners: [{ name: 'Paula Verhoeven' }],
    industry: ['Retail', 'R&D'],
    modalities: ['Image', 'Recognition'],
    summary: 'Security cameras in retail stores feed live video into the swarm, which analyzes stock levels across the aisles in real-time. The system generates notifications for staff when items are missing and provides live updates on current inventory, keeping shelves stocked without manual audits.'
  },
  {
    slug: 'deep-backoffice',
    title: 'Deep Backoffice',
    image: deepBackofficeArt,
    year: 2026,
    partners: [{ name: 'Homahuki', link: {href: 'https://homahuki.eu', external: true }}],
    industry: ['Healthcare', 'R&D'],
    modalities: ['Text', 'Retrieval'],
    summary: 'A platform for a medical community practice automates timetable generation for work hours and serves as the communication hub for staff reporting delays or calling in sick. The swarm generates relevant documents and supports the team with a knowledge base, absorbing the administrative load.'
  },
  {
    slug: 'kupf-bot',
    title: 'Kupf Bot',
    image: kupfBotArt,
    year: 2026,
    partners: [
      { name: 'KUPF', link: { href: 'https://kupf.at', external: true } }
    ],
    industry: ['Arts & Culture'],
    modalities: ['Retrieval'],
    summary: 'Kupf Bot uses SwISD to structure the contents of PDFs that users upload, then handles task queueing within a middleware for generative text AI. The swarm manages the orchestration layer, letting the generative models focus entirely on producing text.'
  },
  {
    slug: 'mozarteum-webxr',
    title: 'Mozarteum X-Reality',
    image: webxrArt,
    year: 2026,
    partners: [
      { name: 'Hidéo Snes', link: { href: 'https://hideosnes.online', external: true } }
    ],
    industry: ['Arts & Culture', 'Technology'],
    modalities: ['Audio', 'Recognition'],
    summary: 'Hidéo Snes transforms the swarm into a multimodal input device for an interactive instrument for the X-Reality space of Mozarteum. The system processes voice, movement, gestures, and posture in real-time, supported by a dedicated Unreal Engine 5 plugin that bridges the decentralized swarm directly into immersive 3D environments.'
  },
  {
    slug: 'biometric-expressions',
    title: 'Biometric Expressions',
    image: biometricExpressionsArt,
    year: 2027,
    partners: [
      { name: 'Noid Haberl', link: { href: 'https://noid.klingt.org', external: true } }
    ],
    industry: ['Arts & Culture', 'R&D'],
    modalities: ['Image', 'Recognition'],
    summary: 'Cellist Noid Haberl captures the biometric data of a musician\'s face during performance, treating expressions as unique as fingerprints. SwISD processes these visual inputs in real-time to generate dynamic graphical notations, turning physical exertion into a living, decentralized score.'
  },
  {
    slug: 'sunday-in-osaka',
    title: 'Sunday in Osaka',
    image: sundayInOsakaArt,
    year: 2027,
    partners: [
      { name: 'Chinami Sato' }
    ],
    industry: ['Arts & Culture', 'Event'],
    modalities: ['Text', 'Image'],
    summary: 'Chinami Sato reimagines AI interaction as a communal, outdoor experience rather than an isolated screen-time activity. Using SwISD, she deploys ephemeral, decentralized nodes in public parks, allowing groups to interact with generative models collectively in open spaces without relying on centralized cloud infrastructure.'
  },
  {
    slug: 'growing-ledgers',
    title: 'Growing Ledgers',
    image: voxerlArt,
    year: 2027,
    partners: [
      { name: 'Voxerl', link: { href: 'https://voxerl.at', external: true } }
    ],
    industry: ['Finance'],
    modalities: ['Classification'],
    summary: 'Austrian fintech startup Voxerl leverages SwISD to maintain persistent, decentralized backups of client ledgers and assets. When primary server infrastructure fails, the swarm acts as an ultra-low-resource fallback, ensuring essential financial services and transaction histories remain available and synchronized across the edge mesh.'
  },
  {
    slug: 'symposion-lindabrunn',
    title: 'Symposion Lindabrunn',
    image: lindabrunnRagArt,
    year: 2027,
    partners: [
      { name: 'Symposion Lindabrunn', link: { href: 'https://symposion-lindabrunn.at', external: true } }
    ],
    industry: ['Arts & Culture'],
    modalities: ['Text', 'Retrieval', 'Classification'],
    summary: 'Symposion Lindabrunn runs a solar powered compute mesh across its sculpture park in Lower Austria. The localized swarm hosts a private language model and retrieval pipeline that stays entirely off the public internet. The system indexes decades of historical archives, supports the daily operations of the institution, and provides a conversational guide for park visitors.'
  }
];

// Chronological order (oldest to newest) as locked in spec
export const cases: readonly CaseEntry[] = [...rawCases].sort((a, b) => a.year - b.year);