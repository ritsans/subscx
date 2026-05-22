type Props = {
  monthlyTotal: number;
  yearlyTotal: number;
  count: number;
  aiCount: number;
};

export function SummaryCards({ monthlyTotal, yearlyTotal, count, aiCount }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* 今月の合計 */}
      <div className="rounded-2xl bg-violet-600 p-5 text-white shadow-sm">
        <p className="mb-3 font-medium text-violet-200 text-xs">今月の合計</p>
        <p className="font-bold text-3xl tracking-tight">¥{monthlyTotal.toLocaleString()}</p>
        <p className="mt-2 text-violet-300 text-xs">月額換算</p>
      </div>

      {/* 年額換算 */}
      <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
        <p className="mb-3 font-medium text-stone-400 text-xs">年額換算</p>
        <p className="font-bold text-3xl text-stone-900 tracking-tight">¥{yearlyTotal.toLocaleString()}</p>
        <p className="mt-2 text-stone-400 text-xs">このペースで年間</p>
      </div>

      {/* 登録サービス数 */}
      <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
        <p className="mb-3 font-medium text-stone-400 text-xs">登録サービス</p>
        <p className="font-bold text-3xl text-stone-900 tracking-tight">
          {count}
          <span className="ml-1 font-medium text-base text-stone-400">件</span>
        </p>
        <p className="mt-2 text-stone-400 text-xs">{aiCount > 0 ? `うち AI ${aiCount}件` : '登録中'}</p>
      </div>
    </div>
  );
}
