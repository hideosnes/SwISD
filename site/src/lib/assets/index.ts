/**
 * 1. Relative path: site/src/lib/assets/index.ts
 * 2. Description: Barrel export for static assets.
 * 3. Expects: Vite asset imports.
 * 4. Provides: Single import surface for all image assets and the lazy gallery pool.
 */
export { default as swisdLogo } from './swisd-logo.png';
export { default as huggingfaceLogo } from './huggingface.png';
export { default as nodejsLogo } from './nodejs.png';
export { default as webgpuLogo } from './webgpu.svg';
export { default as sdg9 } from './sdg9.png';
export { default as sdg12 } from './sdg12.png';
export { default as sdg16 } from './sdg16.png';
export * from './gallery';