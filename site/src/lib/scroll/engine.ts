/**
 * 1. Relative path: site/src/lib/scroll/engine.ts
 * 2. Description: Lenis-powered scroll engine.
 * 3. Expects: Browser environment.
 * 4. Provides: Premium inertial wheel glide, programmatic navigation.
 */
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export type ScrollEngine = {
	scrollToIndex: (index: number) => void;
	scrollToId: (id: string) => void;
	destroy: () => void;
};

type EngineOptions = {
	sectionIds: readonly string[];
};

const GLIDE_EASING = (t: number): number => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function createScrollEngine({ sectionIds }: EngineOptions): ScrollEngine {
	if (typeof window === 'undefined') {
		return { scrollToIndex: () => {}, scrollToId: () => {}, destroy: () => {} };
	}

	const lenis = new Lenis({
		duration: 1.2,
		easing: GLIDE_EASING,
		smoothWheel: true,
		touchMultiplier: 1.5
	});
	lenis.start();
	console.info('[swisd:scroll] engine=lenis (glide armed)');

	let rafId = 0;

	function raf(time: number): void {
		lenis.raf(time);
		rafId = requestAnimationFrame(raf);
	}
	rafId = requestAnimationFrame(raf);

	function glideTo(el: HTMLElement | null): void {
		if (!el) return;
		lenis.scrollTo(el, {
			duration: 1.0,
			easing: GLIDE_EASING
		});
	}

	return {
		scrollToIndex: (index) => glideTo(document.getElementById(sectionIds[index])),
		scrollToId: (id) => glideTo(document.getElementById(id)),
		destroy: () => {
			cancelAnimationFrame(rafId);
			lenis.destroy();
		}
	};
}