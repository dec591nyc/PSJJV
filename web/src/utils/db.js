import { createClient } from '@libsql/client';

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

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
