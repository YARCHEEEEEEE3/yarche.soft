import { mkdir, writeFile } from 'node:fs/promises';
import { createFishClient } from '../server/fish.mjs';

// This secret is for a manual live smoke test only; the multi-user server never uses it as a fallback.
const key = process.env.FISH_AUDIO_API_KEY;
if (!key) {
  console.error('Live test not run: add FISH_AUDIO_API_KEY through secure environment settings.');
  process.exitCode = 2;
} else {
  try {
    const fish = createFishClient();
    const voices = await fish.voices(key);
    const voiceId = process.env.FISH_TEST_VOICE_ID || voices.items[0]?.id;
    if (!voiceId) throw Error('NO_READY_VOICE');
    const audio = await fish.tts(key, { text: 'Привіт! Це тест озвучки студії SAKYRA.', voiceId, speed: 1 });
    await mkdir('artifacts', { recursive: true });
    await writeFile('artifacts/fish-live-test.mp3', audio, { mode: 0o600 });
    console.log(`Live Fish Audio test passed: s2.1-pro-free, ${audio.length} MP3 bytes saved to artifacts/fish-live-test.mp3`);
  } catch (error) {
    console.error(`Live Fish Audio test failed: ${error.code || 'REQUEST_FAILED'}`);
    process.exitCode = 1;
  }
}
