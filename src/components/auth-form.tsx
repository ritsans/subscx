'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

type Tab = 'login' | 'signup';

export default function AuthForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setPending(true);

    try {
      if (tab === 'login') {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) {
          setError(err.message ?? 'ログインに失敗しました');
          return;
        }
      } else {
        const { error: err } = await authClient.signUp.email({ name, email, password });
        if (err) {
          setError(err.message ?? '登録に失敗しました');
          return;
        }
      }
      router.push('/dashboard');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 24 }}>subscx</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => {
            setTab('login');
            setError('');
          }}
          style={{
            fontWeight: tab === 'login' ? 'bold' : 'normal',
            textDecoration: tab === 'login' ? 'underline' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          ログイン
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('signup');
            setError('');
          }}
          style={{
            fontWeight: tab === 'signup' ? 'bold' : 'normal',
            textDecoration: tab === 'signup' ? 'underline' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          新規登録
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'signup' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>名前</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
            />
          </label>
        )}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>メールアドレス</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>パスワード</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
          />
        </label>

        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={pending}
          style={{
            padding: '10px',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: pending ? 'not-allowed' : 'pointer',
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? '処理中...' : tab === 'login' ? 'ログイン' : '登録'}
        </button>
      </form>
    </div>
  );
}
