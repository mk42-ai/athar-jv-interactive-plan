// Only populated by the authorized, no-store bootstrap. No business payload or persistent storage.
let presentation;
const freeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
export function initializePresentation(data) {
  if (presentation) throw new Error('Presentation is already initialized. Reload to refresh authorized data.');
  if (!data?.plan || !Array.isArray(data.plan.months) || !Array.isArray(data.plan.gates) || !data.plan.overview || !Array.isArray(data.guideScript) || !data.guideScript.length || !Array.isArray(data.suggestedQuestions) || typeof data.deck?.filename !== 'string' || !/^[a-f0-9]{64}$/.test(data.deck.sha256)) {
    throw new Error('The authorized presentation response is incomplete.');
  }
  presentation = freeze(data);
  return presentation;
}
export function getPresentationData() {
  if (!presentation) throw new Error('Authorized presentation bootstrap is required.');
  return presentation;
}
