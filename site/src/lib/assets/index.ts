/**
 * 1. Relative path: site/src/lib/assets/index.ts
 * 2. Description: Barrel export for static assets.
 * 3. Expects: Vite asset imports.
 * 4. Provides: Single import surface for all image assets and the lazy gallery pool.
 */

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

export {default as ndaLogo} from './nda-logo.png';
export * from './gallery';
/* no export for swisd-xx.jpg deep histories images - loaded via script! */