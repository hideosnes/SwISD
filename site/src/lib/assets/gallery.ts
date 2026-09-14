/**
 * 1. Relative path: site/src/lib/assets/gallery.ts
 * 2. Description: Lazy artwork pool for the roadmap modal with per-artist credit metadata.
 * 3. Expects: JPEG assets in this folder and a credit rule for every filename prefix.
 * 4. Provides: A readonly gallery of lazy loaders plus strict artist credit resolution.
 */
export type ArtistLink = {
  readonly href: string;
  readonly label: string;
};

export type ArtistCredit = {
  readonly artist: string;
  readonly year: string;
  readonly projectLink: ArtistLink;
  readonly websiteLink: ArtistLink;
};

export type GalleryImage = {
  readonly key: string;
  readonly credit: ArtistCredit;
  readonly load: () => Promise<{ default: string }>;
};

type CreditRule = {
  readonly prefix: string;
  readonly credit: ArtistCredit;
};

const CREDIT_RULES: readonly CreditRule[] = [
  {
    prefix: './swisd-',
    credit: {
      artist: 'Hidéo SNES',
      year: '2026',
      projectLink: { href: '/case-studies#deep-histories', label: 'Deep Histories' },
      websiteLink: { href: 'https://hideosnes.online', label: 'hideosnes.online' }
    }
  }
];

const jpegModules = import.meta.glob<{ default: string }>('./*.jpg');

function ruleFor(key: string): CreditRule | undefined {
  return CREDIT_RULES.find((rule) => key.startsWith(rule.prefix));
}

export const galleryImages: readonly GalleryImage[] = Object.entries(jpegModules).flatMap(
  ([key, load]): GalleryImage[] => {
    const rule = ruleFor(key);
    if (rule === undefined) return [];
    return [{ key, credit: rule.credit, load }];
  }
);

export function randomGalleryImage(): GalleryImage | null {
  if (galleryImages.length === 0) return null;
  const index = Math.floor(Math.random() * galleryImages.length);
  return galleryImages[index] ?? null;
}