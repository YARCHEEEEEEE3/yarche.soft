import { createServer } from 'node:http';
import { ApiError, MAX_TEXT, MODEL } from './fish.mjs';

async function jsonBody(req, maxBytes = 65_536) {
  if (!/^application\/json(;|$)/i.test(req.headers['content-type'] || '')) throw new ApiError(415, 'JSON_REQUIRED');
  const parts = []; let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > maxBytes) throw new ApiError(413, 'REQUEST_TOO_LARGE');
    parts.push(chunk);
  }
  try { const value = JSON.parse(Buffer.concat(parts).toString()); if (!value || Array.isArray(value) || typeof value !== 'object') throw Error(); return value; }
  catch { throw new ApiError(400, 'INVALID_JSON'); }
}

// Dependencies are injected for tests; the production entry point always verifies Supabase tokens.
export function createApiServer({ authenticate, vault, fish, openaiVault, openai, origins = [], ready = true }) {
  const active = new Set(), limits = new Map();
  return createServer({ requestTimeout: 30_000, headersTimeout: 15_000 }, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Vary', 'Origin');
    const abort = new AbortController();
    res.on('close', () => { if (!res.writableEnded) abort.abort(); });
    const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
    try {
      const origin = req.headers.origin;
      if (origin && !origins.includes(origin)) throw new ApiError(403, 'ORIGIN_NOT_ALLOWED');
      if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        res.writeHead(204); res.end(); return;
      }
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/health' && req.method === 'GET') return json(ready ? 200 : 503, { ready, model: MODEL });
      const openAIPath = ['/api/openai/key', '/api/openai/plan'].includes(url.pathname);
      if (!openAIPath && !['/api/fish/key', '/api/fish/voices', '/api/fish/tts'].includes(url.pathname)) throw new ApiError(404, 'NOT_FOUND');
      const user = await authenticate(req);
      if (openAIPath ? !openaiVault || !openai : !ready) throw new ApiError(503, 'SERVER_NOT_CONFIGURED');
      const limitId = openAIPath ? 'openai:' + user : user;
      const now = Date.now();
      // Expire buckets on every authenticated request to bound memory without timers.
      for (const [id, bucket] of limits) if (bucket.until < now) limits.delete(id);
      const bucket = limits.get(limitId) || { count: 0, until: now + 60_000 };
      if (++bucket.count > 40) throw new ApiError(429, 'RATE_LIMIT');
      limits.set(limitId, bucket);
      if (openAIPath) {
        const keyRoute = url.pathname === '/api/openai/key';
        if (keyRoute && req.method === 'GET') return json(200, { configured: !!await openaiVault.get(user) });
        if (!(keyRoute ? ['PUT', 'DELETE'] : ['POST']).includes(req.method)) throw new ApiError(405, 'METHOD_NOT_ALLOWED');
        const operation = limitId;
        if (active.has(operation)) throw new ApiError(409, 'REQUEST_IN_PROGRESS');
        active.add(operation);
        try {
          if (keyRoute && req.method === 'DELETE') {
            await openaiVault.remove(user);
            return json(200, { configured: false });
          }
          const body = await jsonBody(req, keyRoute ? 65_536 : 128_000);
          if (keyRoute) {
            const key = typeof body.key === 'string' ? body.key.trim() : '';
            if (!/^sk-[A-Za-z0-9_-]{10,509}$/.test(key)) throw new ApiError(400, 'OPENAI_INVALID_KEY');
            await openaiVault.put(user, key);
            return json(200, { configured: true });
          }
          const key = await openaiVault.get(user);
          if (!key) throw new ApiError(409, 'OPENAI_KEY_REQUIRED');
          return json(200, await openai.analyze(key, body, abort.signal));
        } finally { active.delete(operation); }
      }
      if (url.pathname === '/api/fish/key') {
        if (req.method === 'GET') return json(200, { configured: !!await vault.get(user), model: MODEL, maxText: MAX_TEXT });
        if (!['PUT', 'DELETE'].includes(req.method)) throw new ApiError(405, 'METHOD_NOT_ALLOWED');
        if (active.has(user)) throw new ApiError(409, 'REQUEST_IN_PROGRESS');
        active.add(user);
        try {
          if (req.method === 'DELETE') { await vault.remove(user); return json(200, { configured: false }); }
          const body = await jsonBody(req), key = typeof body.key === 'string' ? body.key.trim() : '';
          if (key.length < 10 || key.length > 512 || /[^\x21-\x7e]/.test(key)) throw new ApiError(400, 'INVALID_KEY');
          await fish.voices(key, { page: 1 }, abort.signal); // Verify before replacing the working key.
          await vault.put(user, key);
          return json(200, { configured: true });
        } finally { active.delete(user); }
      }
      const key = await vault.get(user);
      if (!key) throw new ApiError(409, 'FISH_KEY_REQUIRED');
      if (url.pathname === '/api/fish/voices' && req.method === 'GET') {
        const page = Number(url.searchParams.get('page') || 1), query = url.searchParams.get('q') || '';
        if (!Number.isInteger(page) || page < 1 || page > 10_000 || query.length > 100) throw new ApiError(400, 'INVALID_QUERY');
        return json(200, await fish.voices(key, { page, query, own: url.searchParams.get('own') === 'true' }, abort.signal));
      }
      if (url.pathname === '/api/fish/tts' && req.method === 'POST') {
        if (active.has(user)) throw new ApiError(409, 'REQUEST_IN_PROGRESS');
        active.add(user);
        try {
          const input = await jsonBody(req);
          const audio = await fish.tts(key, input, abort.signal);
          res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': audio.length, 'Content-Disposition': 'attachment; filename="sakyra-voice.mp3"' });
          res.end(audio); return;
        } finally { active.delete(user); }
      }
      throw new ApiError(405, 'METHOD_NOT_ALLOWED');
    } catch (error) {
      if (res.destroyed) return;
      // No raw exception, upstream body, token, key, or user text is logged or returned.
      json(error instanceof ApiError ? error.status : 500, { code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR' });
    }
  });
}
