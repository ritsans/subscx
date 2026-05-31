import Link from 'next/link';
import { UserMenu } from './UserMenu';

type Props = {
  userName: string;
  userEmail: string;
};

export function Header({ userName, userEmail }: Props) {
  return (
    <header className="sticky top-0 z-40 border-stone-200/60 border-b bg-[#f7f5f2]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <span className="font-semibold text-sm text-stone-900 tracking-tight">subscx</span>
          <nav className="hidden items-center gap-1 sm:flex">
            {(['サービス', 'カレンダー', '設定'] as const).map((label) => (
              <Link
                key={label}
                href="#"
                className="rounded-lg px-3 py-1.5 font-medium text-stone-500 text-xs transition-colors hover:bg-stone-100/80 hover:text-stone-900"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="通知"
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6v3.5L2 11v.5h12V11l-1.5-1.5V6C12.5 3.5 10.5 1.5 8 1.5ZM6.5 12a1.5 1.5 0 0 0 3 0"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <UserMenu userName={userName} userEmail={userEmail} />
        </div>
      </div>
    </header>
  );
}
