type Props = {
  daysUntil: number;
};

/**
 * 7日以内の課金を強調するバッジ。
 * - 0       → "今日"
 * - 1..7    → "あと◯日"
 * - 8以上   → 描画しない
 */
export function NextBillingBadge({ daysUntil }: Props) {
  if (daysUntil < 0 || daysUntil > 7) return null;

  const label = daysUntil === 0 ? '今日' : `あと${daysUntil}日`;

  return (
    <output
      className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-red-500 px-2 font-bold text-white text-xs shadow-sm"
      aria-label={`次回請求まで ${label}`}
    >
      {label}
    </output>
  );
}
