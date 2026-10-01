/**
 * 1. Relative path: site/src/lib/assets/index.ts
 * 2. Description: Barrel export for static assets.
 * 3. Expects: Vite asset imports.
 * 4. Provides: Single import surface for all image assets and the lazy gallery pool.
 */

// Challenges
export { default as ioebLogo } from './ioeb-logo.png'

// Core & Tech Stack
export { default as swisdLogo } from './swisd-logo.png';
export { default as huggingfaceLogo } from './huggingface-logo.png';
export { default as nodejsLogo } from './nodejs-logo.png';
export { default as webgpuLogo } from './webgpu-logo.png';

// Sustainable Development Goals
export { default as sdg9 } from './sdg9.png';
export { default as sdg12 } from './sdg12.png';
export { default as sdg16 } from './sdg16.png';

// Grants & Funding
export { default as ffgLogo } from './ffg-logo.png';
export { default as hpcjuLogo } from './hpcju-logo.png';
export { default as stsbgLogo } from './stsbg-logo.png';

// Institutional & Cultural Partners
export { default as angewandteLogo } from './angewandte-logo.png';
export { default as deephistoriesLogo } from './deephistories-logo.png';
export { default as europarkLogo } from './europark-logo.png';
export { default as fhsbgLogo } from './fhsbg-logo.png';
export { default as gelaoxLogo } from './gelaox-logo.png';
export { default as hideosnesLogo } from './hideosnes-logo.png';
export { default as kupfLogo } from './kupf-logo.png';
export { default as mozarteumLogo } from './mozarteum-logo.svg';
export { default as schmiedeLogo } from './schmiede-logo.png';
export { default as sparLogo } from './spar-logo.png';
export { default as subnetLogo } from './subnet-logo.png';
export { default as symposionlindabrunnLogo } from './symposionlindabrunn-logo.png';
export { default as tolukaLogo } from './toluka-logo.png';
export { default as villavidaLogo } from './villavida-logo.png';
export { default as voxerlLogo } from './voxerl-logo.png';
export { default as monochromLogo } from './monochrom-logo.png';
export { default as swkLogo } from './stadtwienkultur-logo.png';
export { default as klnoeLogo } from './kulturnoe-logo.png';

export { default as ndaLogo } from './nda-logo.png';
export * from './gallery';

// Case Studies Artwork
export { default as deepBackofficeArt } from './case-studies/deep-backoffice.jpg';
export { default as deepHistoriesArt } from './case-studies/deep-histories.jpg';
export { default as intelligentMicrophoneArt } from './case-studies/intelligent-microphone.jpg';
export { default as kupfBotArt } from './case-studies/kupf-bot.jpg';
export { default as retailAnalysisArt } from './case-studies/retail-analysis.jpg';
export { default as ricaFuentesArt } from './case-studies/rica-fuentes.jpg'
export { default as biometricExpressionsArt } from './case-studies/biometric-expressions.jpg'
export { default as sundayInOsakaArt } from './case-studies/sunday-in-osaka.jpg'
export { default as voxerlArt } from './case-studies/voxerl.jpg'
export { default as webxrArt } from './case-studies/webxr.jpg'
export { default as lindabrunnRagArt } from './case-studies/lindabrunnRagArt.webp'
/* ===== Roadmap artwork pool (swisd-01.jpg … swisd-60.jpg) — LAZY loaders ===== */
const artworkLoaders = import.meta.glob('./swisd-*.jpg', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<string>>;

export const roadmapArtworkLoaders: readonly (() => Promise<string>)[] = Object.keys(artworkLoaders)
  .sort()
  .map((key) => artworkLoaders[key])
  .filter((loader): loader is () => Promise<string> => loader !== undefined);