import { Pool } from 'pg';

const connectionString = process.env.PUBLIC_SAFETY_DATABASE_URL;

let pool = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

export default pool;
