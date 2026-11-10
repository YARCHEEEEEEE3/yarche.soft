import { ApiError } from './fish.mjs';

export function createAuthenticate({ url, publicKey, fetcher = fetch }) {
  if (url && new URL(url).protocol !== 'https:') throw new Error('SUPABASE_URL must use HTTPS');
  return async request => {
    if (!url || !publicKey) throw new ApiError(503, 'AUTH_NOT_CONFIGURED');
    const bearer = request.headers.authorization;
    if (!bearer || !/^Bearer [A-Za-z0-9_.-]{20,8192}$/.test(bearer)) throw new ApiError(401, 'SIGN_IN_REQUIRED');
    let response;
    try {
      response = await fetcher(`${url.replace(/\/$/, '')}/auth/v1/user`, { redirect: 'error', headers: { Authorization: bearer, apikey: publicKey }, signal: AbortSignal.timeout(10_000) });
    } catch { throw new ApiError(503, 'AUTH_UNAVAILABLE'); }
    if (response.status === 401 || response.status === 403) throw new ApiError(401, 'SIGN_IN_REQUIRED');
    if (!response.ok) throw new ApiError(503, 'AUTH_UNAVAILABLE');
    const user = await response.json();
    if (typeof user.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(user.id)) throw new ApiError(401, 'SIGN_IN_REQUIRED');
    return user.id;
  };
}
