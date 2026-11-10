import { encode } from '@msgpack/msgpack';

export const MODEL = 's2.1-pro-free';
export const MAX_TEXT = 10_000;
export const validVoiceId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
export class ApiError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

// Never forward provider error bodies: they can contain submitted text or credentials.
export function upstreamError(status) {
  if (status === 401) return new ApiError(422, 'FISH_KEY_INVALID');
  if (status === 402) return new ApiError(422, 'FISH_QUOTA');
  if (status === 403) return new ApiError(422, 'FISH_ACCESS_DENIED');
  if (status === 429) return new ApiError(429, 'FISH_RATE_LIMIT');
  if (status === 400 || status === 404 || status === 422) return new ApiError(422, 'FISH_REQUEST_REJECTED');
  return new ApiError(502, 'FISH_UNAVAILABLE');
}

export async function readLimited(response, limit) {
  if (!response.body) throw new ApiError(502, 'FISH_EMPTY_RESPONSE');
  const chunks = []; let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw new ApiError(502, 'FISH_RESPONSE_TOO_LARGE');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function createFishClient({ fetcher = fetch, timeoutMs = 180_000 } = {}) {
  async function request(path, key, options, signal, consume) {
    const timeout = AbortSignal.timeout(timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const response = await fetcher(`https://api.fish.audio${path}`, {
        ...options, redirect: 'error', signal: combined,
        headers: { Authorization: `Bearer ${key}`, ...options.headers },
      });
      if (!response.ok) { await response.body?.cancel(); throw upstreamError(response.status); }
      return await consume(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (timeout.aborted) throw new ApiError(504, 'FISH_TIMEOUT');
      if (signal?.aborted) throw new ApiError(499, 'REQUEST_CANCELLED');
      throw new ApiError(502, 'FISH_UNAVAILABLE');
    }
  }
  return {
    async voices(key, { page = 1, query = '', own = false } = {}, signal) {
      const params = new URLSearchParams({ page_size: '24', page_number: String(page), sort_by: 'task_count', self: String(own) });
      if (query) params.set('title', query);
      return request(`/model?${params}`, key, {}, signal, async response => {
        const data = JSON.parse((await readLimited(response, 2_000_000)).toString());
        if (!Array.isArray(data.items) || !Number.isFinite(data.total)) throw new ApiError(502, 'FISH_INVALID_RESPONSE');
        return { total: data.total, page, items: data.items.filter(v => v.type === 'tts' && v.state === 'trained' && validVoiceId(v._id)).map(v => ({
          id: v._id, title: String(v.title || 'Fish Audio').slice(0, 200),
          description: String(v.description || '').slice(0, 500),
          languages: Array.isArray(v.languages) ? v.languages.filter(s => typeof s === 'string').slice(0, 10) : [],
          tags: Array.isArray(v.tags) ? v.tags.filter(s => typeof s === 'string').slice(0, 5) : [],
        })) };
      });
    },
    async tts(key, { text, voiceId, speed = 1 }, signal) {
      if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT || !validVoiceId(voiceId) || !Number.isFinite(speed) || speed < .5 || speed > 2) throw new ApiError(400, 'INVALID_TTS_INPUT');
      // Mirrors the official fishaudio SDK: model is a header, payload is MessagePack.
      return request('/v1/tts', key, { method: 'POST', headers: { 'Content-Type': 'application/msgpack', model: MODEL },
        body: encode({ text: text.trim(), reference_id: voiceId, format: 'mp3', mp3_bitrate: 128, normalize: true, latency: 'balanced', prosody: { speed, volume: 0 } }),
      }, signal, async response => {
        const type = response.headers.get('content-type') || '';
        if (!/^(audio\/(mpeg|mp3)|application\/octet-stream)(;|$)/i.test(type)) throw new ApiError(502, 'FISH_INVALID_AUDIO');
        const audio = await readLimited(response, 40_000_000);
        const mp3 = audio.subarray(0, 3).toString() === 'ID3' || (audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0);
        if (audio.length < 10 || !mp3) throw new ApiError(502, 'FISH_INVALID_AUDIO');
        return audio;
      });
    },
  };
}
