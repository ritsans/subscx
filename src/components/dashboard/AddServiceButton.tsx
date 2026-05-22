'use client';

type Props = {
  onClick: () => void;
};

export function AddServiceButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 border-dashed bg-transparent p-5 text-stone-400 transition-all duration-200 hover:border-violet-400 hover:bg-violet-50/50 hover:text-violet-500"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-current transition-transform duration-200 group-hover:scale-110">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className="font-medium text-xs">新しいサービス</span>
    </button>
  );
}
