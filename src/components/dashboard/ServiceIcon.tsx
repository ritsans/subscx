import { resolveIcon } from '@/lib/icon-map';
import type { Category } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';

type Props = {
  name: string;
  category: Category;
};

export function ServiceIcon({ name, category }: Props) {
  const entry = resolveIcon(name);

  if (entry?.kind === 'simple-icon') {
    return (
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-stone-200"
        role="img"
        aria-label={`${entry.title} ロゴ`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill={`#${entry.icon.hex}`}
          aria-hidden="true"
        >
          <title>{entry.title}</title>
          <path d={entry.icon.path} />
        </svg>
      </div>
    );
  }

  if (entry?.kind === 'brand-image') {
    return (
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-stone-200"
        style={{ backgroundColor: entry.bgColor ?? 'white' }}
        role="img"
        aria-label={`${entry.title} ロゴ`}
      >
        {/* biome-ignore lint/performance/noImgElement: 固定 28px のブランドアイコン。next/image の最適化メリットがなく、SVG 表示の設定も不要なため img を使用 */}
        <img
          src={`/brand-icons/${entry.slug}.${entry.ext}`}
          alt={entry.title}
          width={28}
          height={28}
          style={{ objectFit: 'contain' }}
        />
      </div>
    );
  }

  const colors = CATEGORY_COLORS[category];
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${colors.bg} ${colors.text}`}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
