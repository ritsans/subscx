import { defineConfig } from 'drizzle-kit';

const tursoDatabaseUrl = process.env.TURSO_DATABASE_URL;

if (!tursoDatabaseUrl) {
  throw new Error('TURSO_DATABASE_URL is not set');
}

export default defineConfig({
  schema: './src/lib/auth-schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: tursoDatabaseUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
