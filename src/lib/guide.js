// Exact operator-provided narration and geometry, initialized before this module is imported.
import { getPresentationData } from './presentationState.js';
export const GUIDE_SCRIPT = getPresentationData().guideScript;
export const GUIDE_STEPS = GUIDE_SCRIPT.flatMap((s) =>
  s.steps.map((st, i) => ({ ...st, slide: s.n, slideTitle: s.title, stepInSlide: i + 1, stepsInSlide: s.steps.length })),
);
export const GUIDE_TOTAL = GUIDE_STEPS.length;
export const firstStepOfSlide = (n) => GUIDE_STEPS.findIndex((s) => s.slide === n);
