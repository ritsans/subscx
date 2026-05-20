import { createClient } from '@libsql/client';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './auth-schema';

// requireEnv env「前提」つぶす書き方。未設定・記述ミスだと落ちて原因が分かりにくなる
// requireEnv('TURSO_DATABASE_URL') にすると、漏れ時に即「何が足りないか」が即分かる関数です
function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const client = createClient({
  url: requireEnv('TURSO_DATABASE_URL'),
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const hasGoogleOAuth = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  emailAndPassword: { enabled: true },
  ...(hasGoogleOAuth
    ? {
        socialProviders: {
          google: {
            clientId: googleClientId as string,
            clientSecret: googleClientSecret as string,
          },
        },
        account: {
          accountLinking: {
            trustedProviders: ['google'],
          },
        },
      }
    : {}),
});
