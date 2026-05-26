export function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-violet-50 px-12 py-10 lg:flex">
      {/* 右上の円形装飾 */}
      <div className="-right-24 -top-24 pointer-events-none absolute size-80 rounded-full bg-violet-200/40" />
      <div className="-right-10 pointer-events-none absolute top-10 size-48 rounded-full bg-violet-300/20" />

      {/* ロゴ */}
      <div className="flex items-center gap-2.5">
        <div
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-lg bg-violet-600 font-bold text-sm text-white"
        >
          s
        </div>
        <span className="font-semibold text-base text-stone-800">subscx</span>
      </div>

      {/* メインコピー */}
      <div className="space-y-6">
        <p className="font-semibold text-violet-600 text-xs uppercase tracking-widest">Subscriptions, Simplified</p>
        <p className="text-4xl font-bold leading-tight text-stone-900">
          毎月の
          <br />
          サブスクを、
          <br />
          ひと目で。
        </p>
        <p className="text-sm text-stone-500 leading-relaxed">
          登録しているサービスをまとめて管理。
          <br />
          合計金額・次回支払日・カテゴリ別の内訳が、
          <br />
          ひとつのダッシュボードで確認できます。
        </p>
      </div>

      {/* プレビューカード (後から実データで復活予定)
      <div className="rounded-2xl border border-stone-100 bg-white px-5 py-4 shadow-sm">
        <p className="mb-3 text-stone-400 text-xs">今月の合計</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            {[
              { label: 'a', bg: 'bg-violet-500' },
              { label: 'N', bg: 'bg-red-500' },
              { label: 'S', bg: 'bg-orange-400' },
              { label: 'Ai', bg: 'bg-blue-500' },
            ].map((chip, i) => (
              <div
                key={chip.label}
                className={`flex size-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white ${chip.bg} ${i > 0 ? '-ml-2' : ''}`}
              >
                {chip.label}
              </div>
            ))}
          </div>
          <span className="font-bold text-stone-900 text-xl">¥18,450</span>
        </div>
      </div>
      */}
    </div>
  );
}
