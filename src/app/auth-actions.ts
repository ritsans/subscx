'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/lib/auth';

export type AuthFormState = {
  error: string;
};

const loginSchema = z.object({
  email: z.email('メールアドレスの形式が不正です'),
  password: z.string().min(1, 'パスワードは必須です'),
  rememberMe: z.union([z.literal('on'), z.undefined()]).transform((value) => value === 'on'),
});

const signupSchema = z.object({
  name: z.string().trim().min(1, '名前は必須です'),
  email: z.email('メールアドレスの形式が不正です'),
  password: z.string().min(1, 'パスワードは必須です'),
});

const INITIAL_STATE: AuthFormState = { error: '' };

export async function loginAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    rememberMe: formData.get('rememberMe') ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '入力内容を確認してください' };
  }

  try {
    await auth.api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'ログインに失敗しました' };
  }

  redirect('/dashboard');
}

export async function signupAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '入力内容を確認してください' };
  }

  try {
    await auth.api.signUpEmail({
      body: parsed.data,
      headers: await headers(),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : '登録に失敗しました' };
  }

  redirect('/dashboard');
}

export { INITIAL_STATE as initialAuthFormState };
