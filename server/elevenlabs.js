// Server-side ElevenLabs client for Guide Mode narration.
// The API key is read from the environment ONLY (ELEVENLABS_API_KEY) — never sent to the browser,
// never written to the repo. Validated 2026-09-04: this key authenticates against
// GET https://api.elevenlabs.io/v1/voices (HTTP 200, free tier). Library voices return
// 402 paid_plan_required on this plan, so the default voice is a premade one ("Adam").

const API = process.env.ELEVENLABS_API_HOST || 'https://api.elevenlabs.io';

// Ranked shortlist supplied with the brief. Entries 1–4 are Voice Library voices, which the
// current (free) plan cannot synthesise through the API (HTTP 402 paid_plan_required) — the
// server resolves the first voice that is actually usable and reports the rest as skipped.
export const RANKED_VOICES = [
  { id: 'NOpBlnGInO9m6vDvFkFC', name: 'Spuds Oxley - Old Storyteller', library: true, settings: { stability: 0.7, similarity_boost: 0.8, style: 0.1, speed: 0.9 } },
  { id: 'n1PvBOwxb8X6m7tahp2h', name: 'Michael C. Vincent - Suspenseful Storyteller', library: true, settings: { stability: 0.65, similarity_boost: 0.75, style: 0.15, speed: 0.9 } },
  { id: 'EkK5I93UQWFDigLMpZcX', name: 'James - Husky, Engaging and Bold', library: true, settings: { stability: 0.7, similarity_boost: 0.8, style: 0.0, speed: 0.85 } },
  { id: 'By0UcwKGzdBf2bf15UtI', name: 'Peter - Confident Storyteller', library: true, settings: { stability: 0.7, similarity_boost: 0.8, style: 0.0, speed: 0.9 } },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', library: false, settings: { stability: 0.7, similarity_boost: 0.8, style: 0.0, speed: 0.9 } },
];

export const ELEVEN = {
  voiceId: process.env.ELEVEN_VOICE_ID || 'pNInz6obpgDQGcFmaJgB', // Adam (premade) — first shortlist entry usable on this plan
  voiceName: process.env.ELEVEN_VOICE_NAME || 'Adam',
  model: process.env.ELEVEN_MODEL || 'eleven_v3',
  fallbackModel: process.env.ELEVEN_FALLBACK_MODEL || 'eleven_multilingual_v2',
  outputFormat: process.env.ELEVEN_OUTPUT_FORMAT || 'mp3_44100_128',
  // Soft-spoken presenter: high stability, style ≈ 0, slightly slower than natural.
  settings: {
    stability: Number(process.env.ELEVEN_STABILITY || 0.7),
    similarity_boost: Number(process.env.ELEVEN_SIMILARITY || 0.8),
    style: Number(process.env.ELEVEN_STYLE || 0.0),
    speed: Number(process.env.ELEVEN_SPEED || 0.9),
    use_speaker_boost: true,
  },
};

export function isElevenConfigured() {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

function key() {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw Object.assign(new Error('Server is missing ELEVENLABS_API_KEY'), { status: 503, code: 'not_configured' });
  return k;
}

async function fail(res, what) {
  let body = {};
  try {
    body = await res.json();
  } catch {
    /* non-JSON error body */
  }
  const detail = body?.detail;
  const code = (typeof detail === 'object' && detail?.status) || (typeof detail === 'string' ? detail : '') || `http_${res.status}`;
  const message = (typeof detail === 'object' && detail?.message) || body?.message || `${what} failed (${res.status})`;
  return Object.assign(new Error(`${code}: ${message}`), { status: res.status, code, upstream: body });
}

/** Synthesise `text` → Buffer (mp3). Throws with .code = paid_plan_required | quota_exceeded | … */
export async function elevenTts(text, { voiceId = ELEVEN.voiceId, model = ELEVEN.model, settings = ELEVEN.settings, outputFormat = ELEVEN.outputFormat } = {}) {
  const res = await fetch(`${API}/v1/text-to-speech/${voiceId}?output_format=${encodeURIComponent(outputFormat)}`, {
    method: 'POST',
    headers: { 'xi-api-key': key(), 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: model, voice_settings: settings }),
  });
  if (!res.ok) throw await fail(res, 'text_to_speech');
  return Buffer.from(await res.arrayBuffer());
}

/** Account/quota probe used by /api/guide/voice (cached by the caller). Never returns the key. */
export async function elevenStatus() {
  const res = await fetch(`${API}/v1/user/subscription`, { headers: { 'xi-api-key': key() } });
  if (!res.ok) throw await fail(res, 'subscription');
  const s = await res.json();
  return { tier: s.tier, charactersUsed: s.character_count, characterLimit: s.character_limit, resetsAt: s.next_character_count_reset_unix ? new Date(s.next_character_count_reset_unix * 1000).toISOString() : null };
}

/** Stable cache key for a narration clip — identical in the pre-bake script and the runtime proxy. */
export function clipKey(crypto, text, { voiceId = ELEVEN.voiceId, model = ELEVEN.model, settings = ELEVEN.settings } = {}) {
  const s = `elevenlabs|${model}|${voiceId}|${settings.stability}|${settings.similarity_boost}|${settings.style}|${settings.speed}|${text}`;
  return crypto.createHash('sha1').update(s).digest('hex');
}
