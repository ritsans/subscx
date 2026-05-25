import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-stone-200/60 border-t bg-[#f7f5f2]">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-6 text-stone-400 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2026 subscx</p>
        <nav aria-label="フッターナビゲーション" className="flex items-center gap-4">
          <Link href="/terms" className="transition-colors hover:text-stone-700">
            利用規約
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-stone-700">
            プライバシー
          </Link>
          <Link href="/support" className="transition-colors hover:text-stone-700">
            サポート
          </Link>
        </nav>
      </div>
    </footer>
  );
}
