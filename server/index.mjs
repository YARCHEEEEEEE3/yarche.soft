import { resolve } from 'node:path';
import { createApiServer } from './app.mjs';
import { createAuthenticate } from './auth.mjs';
import { createVault } from './vault.mjs';
import { createFishClient } from './fish.mjs';

const env = process.env;
const ready = !!(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY && env.FISH_KEY_ENCRYPTION_KEY);
const vault = env.FISH_KEY_ENCRYPTION_KEY ? createVault(resolve(env.FISH_KEY_STORE || '.data/fish-keys'), env.FISH_KEY_ENCRYPTION_KEY) : null;
const origins = (env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(s => s.trim()).filter(Boolean);
const server = createApiServer({
  ready, vault, origins,
  authenticate: createAuthenticate({ url: env.SUPABASE_URL, publicKey: env.SUPABASE_PUBLISHABLE_KEY }),
  fish: createFishClient(),
});
server.listen(Number(env.PORT || 8787), env.HOST || '127.0.0.1', () => console.log(`SAKYRA API listening; configured: ${ready}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
