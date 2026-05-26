import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

const tursoDatabaseUrl = process.env.TURSO_DATABASE_URL;

if (!tursoDatabaseUrl) {
  throw new Error('TURSO_DATABASE_URL is not set');
}

export default defineConfig({
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: tursoDatabaseUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
