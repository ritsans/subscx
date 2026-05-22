'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setPending(true);

    try {
      const { error: err } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      });
      if (err) {
        setError(err.message ?? 'ログインに失敗しました');
        return;
      }
      router.refresh();
      router.push('/dashboard');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* 見出し */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-stone-900">ログイン</h2>
          <p className="text-sm text-stone-500">続けるにはアカウントにサインインしてください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* メールアドレス */}
          <div className="space-y-1.5">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="yuki@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="rounded-lg"
            />
          </div>

          {/* パスワード */}
          <div className="space-y-1.5">
            <Label htmlFor="password">パスワード</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="rounded-lg pr-14"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
                aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* ログイン状態を保持 / パスワードを忘れた */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-4 accent-violet-600"
              />
              <span className="text-sm text-stone-600">ログイン状態を保持</span>
            </label>
            <button type="button" disabled className="text-sm text-violet-600 opacity-60 cursor-not-allowed">
              パスワードを忘れた
            </button>
          </div>

          {/* エラー */}
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* 送信ボタン */}
          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full rounded-lg bg-stone-900 text-sm font-medium text-white hover:bg-stone-800"
          >
            {pending ? '処理中...' : 'ログイン'}
          </Button>
        </form>

        {/* 区切り */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs text-stone-400">または</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        {/* Google ボタン (UI のみ) */}
        <button
          type="button"
          disabled
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 opacity-60 cursor-not-allowed"
        >
          {/* Google SVG ロゴ */}
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z"
            />
          </svg>
          Googleで続ける
        </button>

        {/* 新規登録リンク */}
        <p className="text-center text-sm text-stone-500">
          アカウントをお持ちでない?{' '}
          <Link href="/signup" className="font-medium text-violet-600 hover:underline">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
