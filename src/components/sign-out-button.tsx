'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      style={{ background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}
    >
      ログアウト
    </button>
  );
}
