import { resolveIcon } from '@/lib/icon-map';
import type { Category } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';

type Props = {
  name: string;
  category: Category;
};

export function ServiceIcon({ name, category }: Props) {
  const icon = resolveIcon(name);

  if (icon) {
    return (
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-stone-200"
        role="img"
        aria-label={`${icon.title} ロゴ`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill={`#${icon.hex}`}
          aria-hidden="true"
        >
          <title>{icon.title}</title>
          <path d={icon.path} />
        </svg>
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
