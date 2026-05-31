'use client';

type Props = {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function CalendarHeader({ year, month, onPrev, onNext, onToday }: Props) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-stone-900">
        {year}年 {month + 1}月
      </h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
        >
          前月
        </button>
        <button
          type="button"
          onClick={onToday}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
        >
          今日
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
        >
          翌月
        </button>
      </div>
    </div>
  );
}
