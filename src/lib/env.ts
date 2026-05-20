import 'server-only';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`環境変数:${name}が見当たりません. Environment variable "${name}" is required`);
  return value;
}

export const env = {
  TURSO_DATABASE_URL: requireEnv('TURSO_DATABASE_URL'),
  TURSO_AUTH_TOKEN: requireEnv('TURSO_AUTH_TOKEN'),
  BETTER_AUTH_SECRET: requireEnv('BETTER_AUTH_SECRET'),
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.trim(),
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET?.trim(),
};
