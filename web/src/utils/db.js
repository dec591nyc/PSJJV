import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

function getEnv(key) {
  if (process.env[key]) return process.env[key];
  try {
    const rootEnvPath = path.resolve(process.cwd(), '../.env');
    if (fs.existsSync(rootEnvPath)) {
      const content = fs.readFileSync(rootEnvPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.startsWith(`${key}=`)) {
          return trimmed.slice(key.length + 1).replace(/^["']|["']$/g, '').trim();
        }
      }
    }
  } catch (e) {}
  return '';
}

const tursoUrl = getEnv('TURSO_DATABASE_URL');
const tursoAuthToken = getEnv('TURSO_AUTH_TOKEN');

let client = null;

if (
  tursoUrl &&
  (tursoUrl.startsWith('libsql:') ||
    tursoUrl.startsWith('https:') ||
    tursoUrl.startsWith('http:') ||
    tursoUrl.startsWith('file:'))
) {
  try {
    client = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
  } catch (e) {
    console.warn('Failed to initialize Turso client:', e.message);
  }
}

export default client;
