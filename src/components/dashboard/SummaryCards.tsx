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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-100 via-violet-100 to-purple-100 p-5 shadow-sm">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-violet-200/50" />
        <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-teal-200/40" />
        <p className="relative mb-3 font-medium text-violet-500 text-xs">今月の合計</p>
        <p className="relative font-bold  text-stone-900 leading-none">
          ¥<span className="font-numeric text-4xl">{monthlyTotal.toLocaleString()}</span>
          <span className="ml-1 text-sm font-normal text-stone-500">/ 月</span>
        </p>
      </div>

      {/* 年額換算 */}
      <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
        <p className="mb-3 font-medium text-stone-400 text-xs">年額換算</p>
        <p className="font-bold text-stone-900 leading-none">
          ¥<span className="font-numeric text-3xl">{yearlyTotal.toLocaleString()}</span>
        </p>
        <p className="mt-2 text-stone-400 text-xs">月額×12 + 年額の合計</p>
      </div>

      {/* 登録サービス数 */}
      <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
        <p className="mb-3 font-medium text-stone-400 text-xs">登録サービス</p>
        <p className="font-bold text-stone-900 leading-none">
          <span className="font-numeric text-3xl">{count}</span>
          <span className="ml-1 font-medium text-base text-stone-400">件</span>
        </p>
      </div>
    </div>
  );
}
