import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export function createVault(directory, secret) {
  const master = Buffer.from(secret || '', 'base64');
  if (master.length !== 32) throw new Error('FISH_KEY_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  const file = user => join(directory, createHash('sha256').update(user).digest('hex') + '.json');
  return {
    async get(user) {
      let record;
      try { record = JSON.parse(await readFile(file(user), 'utf8')); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
      const cipher = createDecipheriv('aes-256-gcm', master, Buffer.from(record.iv, 'base64'));
      cipher.setAAD(Buffer.from(user));
      cipher.setAuthTag(Buffer.from(record.tag, 'base64'));
      return Buffer.concat([cipher.update(Buffer.from(record.data, 'base64')), cipher.final()]).toString('utf8');
    },
    async put(user, key) {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', master, iv);
      cipher.setAAD(Buffer.from(user));
      const data = Buffer.concat([cipher.update(key, 'utf8'), cipher.final()]);
      const temp = file(user) + '.' + randomBytes(8).toString('hex') + '.tmp';
      try {
        await writeFile(temp, JSON.stringify({ v: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') }), { mode: 0o600, flag: 'wx' });
        await rename(temp, file(user));
      } finally { await unlink(temp).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
    },
    async remove(user) { await unlink(file(user)).catch(error => { if (error.code !== 'ENOENT') throw error; }); },
  };
}
