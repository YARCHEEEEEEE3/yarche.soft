import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { decode } from '@msgpack/msgpack';
import { createApiServer } from '../app.mjs';
import { createAuthenticate } from '../auth.mjs';
import { createVault } from '../vault.mjs';
import { createFishClient, ApiError, MODEL } from '../fish.mjs';

const mp3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(40)]);
const voice = { _id: 'voice_123', title: 'Test voice', type: 'tts', state: 'trained', languages: ['uk'] };
async function fixture(t, upstream) {
  const directory = await mkdtemp(join(tmpdir(), 'sakyra-api-'));
  const vault = createVault(directory, randomBytes(32).toString('base64'));
  const calls = [];
  const fish = createFishClient({ fetcher: async (url, options) => {
    calls.push({ url, options });
    if (upstream) return upstream(url, options);
    return url.includes('/v1/tts') ? new Response(mp3, { headers: { 'Content-Type': 'audio/mpeg' } }) : Response.json({ total: 1, items: [voice, {...voice, _id: 'training_voice', state: 'training'}, {...voice, _id: 'singing_voice', type: 'svc'}] });
  }});
  const authenticate = createAuthenticate({ url: 'https://test.supabase.co', publicKey: 'public-test-key', fetcher: async (_url, options) => {
    if (options.headers.Authorization === 'Bearer ' + 'a'.repeat(30)) return Response.json({ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' });
    if (options.headers.Authorization === 'Bearer ' + 'b'.repeat(30)) return Response.json({ id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });
    return new Response(null, { status: 401 });
  }});
  const server = createApiServer({ authenticate, vault, fish, origins: ['http://localhost:5173'] });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); });
  const request = (path, options = {}, user = 'a') => fetch(`http://127.0.0.1:${server.address().port}/api/fish/${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: 'Bearer ' + user.repeat(30) } : {}), ...options.headers } });
  return { request, vault, directory, calls };
}

test('verified users own encrypted keys; GET never returns the key; removal and wrong-token rejection', async t => {
  const { request, directory } = await fixture(t);
  assert.equal((await request('key', {}, '')).status, 401);
  assert.equal((await request('key', {}, 'x')).status, 401);
  const key = 'fake-private-fish-key-for-test';
  assert.equal((await request('key', { method: 'PUT', body: JSON.stringify({ key, userId: 'b' }) })).status, 200);
  const result = await request('key'); assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await result.json(), { configured: true, model: MODEL, maxText: 10000 });
  assert.equal((await (await request('key', {}, 'b')).json()).configured, false);
  assert.equal((await request('tts', { method: 'POST', body: JSON.stringify({ text: 'Hi', voiceId: 'voice_123' }) }, 'b')).status, 409);
  const [name] = await readdir(directory), file = join(directory, name), contents = await readFile(file, 'utf8');
  assert.ok(!contents.includes(key)); assert.equal((await stat(file)).mode & 0o777, 0o600);
  assert.equal((await request('key', { method: 'DELETE' })).status, 200);
  assert.equal((await (await request('key')).json()).configured, false);
});

test('full API flow sends exact model, Bearer and MessagePack and returns downloadable MP3', async t => {
  const { request, calls } = await fixture(t);
  await request('key', { method: 'PUT', body: JSON.stringify({ key: 'fake-test-key' }) });
  const voices = await (await request('voices?page=2&q=calm&own=true')).json();
  assert.equal(voices.items[0].id, voice._id); assert.equal(voices.items.length, 1);
  assert.match(calls.at(-1).url, /page_number=2/); assert.match(calls.at(-1).url, /self=true/);
  const response = await request('tts', { method: 'POST', body: JSON.stringify({ text: 'Привіт, студіє!', voiceId: voice._id, speed: 1.25 }) });
  assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'audio/mpeg');
  assert.match(response.headers.get('content-disposition'), /\.mp3/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), mp3);
  const sent = calls.at(-1); assert.equal(sent.url, 'https://api.fish.audio/v1/tts');
  assert.equal(sent.options.headers.Authorization, 'Bearer fake-test-key'); assert.equal(sent.options.headers.model, 's2.1-pro-free');
  assert.equal(sent.options.headers['Content-Type'], 'application/msgpack');
  assert.deepEqual(decode(sent.options.body), { text: 'Привіт, студіє!', reference_id: voice._id, format: 'mp3', mp3_bitrate: 128, normalize: true, latency: 'balanced', prosody: { speed: 1.25, volume: 0 } });
});

test('rejects oversized, empty and invalid input, bad origins and unsupported content types before TTS', async t => {
  const { request, calls } = await fixture(t);
  await request('key', { method: 'PUT', body: JSON.stringify({ key: 'fake-test-key' }) });
  for (const body of [{ text: '', voiceId: 'ok' }, { text: 'x'.repeat(10001), voiceId: 'ok' }, { text: 'Hi', voiceId: '../../x' }, { text: 'Hi', voiceId: 'ok', speed: 10 }]) assert.equal((await request('tts', { method: 'POST', body: JSON.stringify(body) })).status, 400);
  assert.equal((await request('tts', { method: 'POST', body: '{}', headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await request('key', { headers: { Origin: 'https://evil.example' } })).status, 403);
  assert.equal(calls.length, 1);
});

test('provider errors are mapped and redacted; invalid replacement preserves original key', async t => {
  let status = 200;
  const { request } = await fixture(t, () => status === 200 ? Response.json({ total: 1, items: [voice] }) : new Response('sensitive-key-and-script', { status }));
  await request('key', { method: 'PUT', body: JSON.stringify({ key: 'working-test-key' }) });
  for (const [upstream, code] of [[401, 'FISH_KEY_INVALID'], [402, 'FISH_QUOTA'], [403, 'FISH_ACCESS_DENIED'], [429, 'FISH_RATE_LIMIT'], [500, 'FISH_UNAVAILABLE'], [422, 'FISH_REQUEST_REJECTED']]) {
    status = upstream;
    const response = await request('key', { method: 'PUT', body: JSON.stringify({ key: 'new-test-key' }) });
    assert.deepEqual(await response.json(), { code });
  }
  assert.equal((await (await request('key')).json()).configured, true);
});

test('ciphertext is tied to its owner; corruption cannot decrypt', async t => {
  const { vault, directory } = await fixture(t);
  await vault.put('alice', 'secret-alice'); await vault.put('bob', 'secret-bob');
  const files = await readdir(directory), record = await readFile(join(directory, files[0]));
  await writeFile(join(directory, files[1]), record);
  await assert.rejects(async () => { await vault.get('alice'); await vault.get('bob'); });
});

test('same-user concurrent TTS is rejected; no duplicated provider request', async t => {
  let release; const wait = new Promise(resolve => { release = resolve; });
  let started; const began = new Promise(resolve => { started = resolve; });
  const { request } = await fixture(t, async url => {
    if (!url.includes('/v1/tts')) return Response.json({ total: 1, items: [voice] });
    started(); await wait; return new Response(mp3, { headers: { 'content-type': 'audio/mpeg' } });
  });
  await request('key', { method: 'PUT', body: JSON.stringify({ key: 'fake-test-key' }) });
  const options = { method: 'POST', body: JSON.stringify({ text: 'Hi', voiceId: 'voice_123' }) };
  const first = request('tts', options); await began;
  assert.equal((await request('tts', options)).status, 409);
  release(); assert.equal((await first).status, 200);
});

test('timeout, malformed audio and missing backend configuration fail clearly', async () => {
  const timeoutClient = createFishClient({ timeoutMs: 5, fetcher: (_url, { signal }) => new Promise((_, reject) => {
    const timer = setTimeout(() => reject(Error('test guard')), 100);
    signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); });
  }) });
  await assert.rejects(timeoutClient.tts('test', { text: 'Hi', voiceId: 'ok' }), error => error.code === 'FISH_TIMEOUT');
  const bad = createFishClient({ fetcher: async () => new Response('not audio', { headers: { 'content-type': 'audio/mpeg' } }) });
  await assert.rejects(bad.tts('test', { text: 'Hi', voiceId: 'ok' }), error => error.code === 'FISH_INVALID_AUDIO');
  await assert.rejects(createAuthenticate({})({ headers: {} }), error => error instanceof ApiError && error.code === 'AUTH_NOT_CONFIGURED');
});
