# カレンダー機能 実装計画書

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/calendar` ルートを追加し、ログイン本人のサブスクの請求日を月表示カレンダー (6 週 × 7 日固定) に展開表示する。土日カラーリングと日本祝日 (`@holiday-jp/holiday_jp`) に対応する。

**Architecture:** 純粋関数の日付ロジック (`src/lib/calendar.ts`) を Vitest で TDD。UI は Server Component (page) + Client Component (state を持つ `Calendar` と `CalendarHeader`) + 純粋表示 (`CalendarGrid` / `CalendarCell`)。サブスク全件をページ初回ロード時に取得し、月送り時は `expandSubscriptionsToMonth()` の再計算のみで再フェッチしない。日付キーは `Asia/Tokyo` 基準の `formatYmdInAppTimeZone()` (`@/lib/billing`) を経由する。

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4 (ライトテーマ固定), Vitest 4 (純粋関数のみ), Biome 2, **新規依存: `@holiday-jp/holiday_jp`**

**Spec:** `docs/superpowers/specs/2026-05-29-calendar-design.md`

> **Spec との差異 (実装時に優先する点):**
> - `formatYmdInAppTimeZone()` の export 元は spec 内で `@/lib/utils` と記載されているが、**実体は `@/lib/billing`** にある (`src/lib/billing.ts` に定義済)。本計画書では `@/lib/billing` から import する。
> - spec はファイル名 kebab-case を指示しているが、既存 `src/components/layout/Header.tsx` 等は PascalCase。**新規 `src/components/calendar/` 配下は spec 通り kebab-case** とし、既存ファイルとの命名混在を許容する (spec 優先)。
> - subscriptions 取得関数は `listAll(userId)` が既存 (`src/lib/subscriptions.ts`)。新規関数は追加せず流用する。

---

## ファイル構成

| 種別 | パス | 役割 |
|---|---|---|
| 変更 | `package.json` | `@holiday-jp/holiday_jp` 依存追加 (ユーザー実行) |
| 変更 | `src/lib/types.ts` | `CalendarEvent` / `CalendarDay` 型を追記 |
| 新規 | `src/lib/calendar.ts` | 純粋関数 (日付計算、月グリッド、サブスク展開、グルーピング) |
| 新規 | `src/lib/calendar.test.ts` | calendar.ts の Vitest テスト |
| 新規 | `src/app/calendar/page.tsx` | Server Component。session + listAll → Calendar に渡す |
| 新規 | `src/components/calendar/calendar.tsx` | Client。月状態保持、子に props を渡す親 |
| 新規 | `src/components/calendar/calendar-header.tsx` | Client。年月表示 + 前月/今日/翌月ボタン |
| 新規 | `src/components/calendar/calendar-grid.tsx` | 42 セルを並べる。土日背景色を明示付与 |
| 新規 | `src/components/calendar/calendar-cell.tsx` | 1 日分の表示 |
| 変更 | `src/components/layout/Header.tsx` | カレンダーリンクを `#` から `/calendar` に変更 |

---

## Task 1: 依存追加をユーザーに依頼

**Files:**
- Modify: `package.json` (ユーザー実行)

- [ ] **Step 1: ユーザーに以下のコマンド実行を依頼**

```bash
pnpm add @holiday-jp/holiday_jp
```

> CLAUDE.md 準拠: 自分で `pnpm add` を実行しない。ユーザーが手動で実行してから次タスクへ進む。

- [ ] **Step 2: インストール完了確認**

Run:
```bash
grep '"@holiday-jp/holiday_jp"' package.json
```

期待: 該当行が表示される。表示されなければユーザーに再依頼。

- [ ] **Step 3: コミット**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @holiday-jp/holiday_jp dependency"
```

---

## Task 2: 型定義を追記

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: `src/lib/types.ts` の末尾に追記**

```typescript
export type CalendarEvent = {
  date: string;
  title: string;
  sourceId: string;
};

export type CalendarDay = {
  ymd: string;
  year: number;
  month: number;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeek: number;
  holidayName: string | null;
};
```

- [ ] **Step 2: `pnpm tsc --noEmit`**

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add CalendarEvent and CalendarDay types"
```

---

## Task 3: `calendar.ts` 純粋関数の TDD — formatDateKey / getLastDayOfMonth / prevMonth / nextMonth

**Files:**
- Create: `src/lib/calendar.ts`
- Create: `src/lib/calendar.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/calendar.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { formatDateKey, getLastDayOfMonth, nextMonth, prevMonth } from './calendar';

describe('formatDateKey', () => {
  it('returns YYYY-MM-DD in Asia/Tokyo', () => {
    // 2026-01-01T00:00:00Z は JST で 2026-01-01 09:00
    expect(formatDateKey(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01-01');
  });

  it('handles JST early morning correctly (UTC previous day)', () => {
    // 2026-01-01T15:00:00Z は JST で 2026-01-02 00:00
    expect(formatDateKey(new Date('2026-01-01T15:00:00Z'))).toBe('2026-01-02');
  });
});

describe('getLastDayOfMonth', () => {
  it('returns 31 for January', () => {
    expect(getLastDayOfMonth(2026, 0)).toBe(31);
  });

  it('returns 28 for February non-leap', () => {
    expect(getLastDayOfMonth(2026, 1)).toBe(28);
  });

  it('returns 29 for February leap year', () => {
    expect(getLastDayOfMonth(2024, 1)).toBe(29);
  });

  it('returns 30 for April', () => {
    expect(getLastDayOfMonth(2026, 3)).toBe(30);
  });
});

describe('prevMonth', () => {
  it('rolls over January to previous December', () => {
    expect(prevMonth(2026, 0)).toEqual({ year: 2025, month: 11 });
  });

  it('decrements within year', () => {
    expect(prevMonth(2026, 5)).toEqual({ year: 2026, month: 4 });
  });
});

describe('nextMonth', () => {
  it('rolls over December to next January', () => {
    expect(nextMonth(2026, 11)).toEqual({ year: 2027, month: 0 });
  });

  it('increments within year', () => {
    expect(nextMonth(2026, 5)).toEqual({ year: 2026, month: 6 });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm test src/lib/calendar.test.ts`
期待: モジュール未解決エラーで FAIL。

- [ ] **Step 3: `src/lib/calendar.ts` を実装**

```typescript
import { formatYmdInAppTimeZone } from './billing';

export function formatDateKey(date: Date): string {
  return formatYmdInAppTimeZone(date);
}

export function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) return { year: year - 1, month: 11 };
  return { year, month: month - 1 };
}

export function nextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) return { year: year + 1, month: 0 };
  return { year, month: month + 1 };
}
```

- [ ] **Step 4: テスト通過を確認**

Run: `pnpm test src/lib/calendar.test.ts`
期待: 全テスト PASS。

- [ ] **Step 5: コミット**

```bash
git add src/lib/calendar.ts src/lib/calendar.test.ts
git commit -m "feat(calendar): add date utility helpers"
```

---

## Task 4: `buildMonthGrid()` を TDD

**Files:**
- Modify: `src/lib/calendar.ts`
- Modify: `src/lib/calendar.test.ts`

- [ ] **Step 1: 失敗するテストを追記**

`src/lib/calendar.test.ts` 末尾に追加:

```typescript
import { buildMonthGrid } from './calendar';

describe('buildMonthGrid', () => {
  it('returns exactly 42 cells', () => {
    const today = new Date('2026-05-29T03:00:00Z');
    const grid = buildMonthGrid(2026, 4, today);
    expect(grid).toHaveLength(42);
  });

  it('marks isToday for today in Asia/Tokyo', () => {
    const today = new Date('2026-05-29T03:00:00Z'); // JST 2026-05-29 12:00
    const grid = buildMonthGrid(2026, 4, today);
    const todayCells = grid.filter((d) => d.isToday);
    expect(todayCells).toHaveLength(1);
    expect(todayCells[0].ymd).toBe('2026-05-29');
  });

  it('marks isCurrentMonth correctly', () => {
    const today = new Date('2026-05-15T03:00:00Z');
    const grid = buildMonthGrid(2026, 4, today); // May
    const currentMonthCells = grid.filter((d) => d.isCurrentMonth);
    expect(currentMonthCells).toHaveLength(31);
    expect(currentMonthCells[0].day).toBe(1);
    expect(currentMonthCells[30].day).toBe(31);
  });

  it('includes trailing days from previous month at the start', () => {
    // May 2026: 1日は金曜 → 前月 (April) の日曜〜木曜が先頭に並ぶ
    const today = new Date('2026-05-15T03:00:00Z');
    const grid = buildMonthGrid(2026, 4, today);
    expect(grid[0].isCurrentMonth).toBe(false);
    expect(grid[0].month).toBe(3); // April
  });

  it('assigns dayOfWeek 0 for Sunday', () => {
    const today = new Date('2026-05-15T03:00:00Z');
    const grid = buildMonthGrid(2026, 4, today);
    // 先頭セルは常に日曜
    expect(grid[0].dayOfWeek).toBe(0);
    expect(grid[6].dayOfWeek).toBe(6);
  });

  it('sets holidayName for Japanese national holidays', () => {
    const today = new Date('2026-05-03T03:00:00Z');
    const grid = buildMonthGrid(2026, 4, today);
    const may3 = grid.find((d) => d.ymd === '2026-05-03');
    expect(may3?.holidayName).toBe('憲法記念日');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm test src/lib/calendar.test.ts`
期待: `buildMonthGrid is not defined` で FAIL。

- [ ] **Step 3: 実装を追加**

`src/lib/calendar.ts` に追記:

```typescript
import * as holidayJp from '@holiday-jp/holiday_jp';
import type { CalendarDay } from './types';

export function buildMonthGrid(year: number, month: number, today: Date): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstOfMonth.getDay();
  const startDate = new Date(year, month, 1 - startDayOfWeek);
  const todayKey = formatDateKey(today);

  const lastDate = new Date(year, month, 1 - startDayOfWeek + 41);
  const holidays = holidayJp.between(startDate, lastDate);
  const holidayMap = new Map<string, string>();
  for (const h of holidays) {
    const key = `${h.date.getFullYear()}-${String(h.date.getMonth() + 1).padStart(2, '0')}-${String(h.date.getDate()).padStart(2, '0')}`;
    holidayMap.set(key, h.name);
  }

  const cells: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startDayOfWeek + i);
    const cellYear = d.getFullYear();
    const cellMonth = d.getMonth();
    const cellDay = d.getDate();
    const ymd = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(cellDay).padStart(2, '0')}`;
    cells.push({
      ymd,
      year: cellYear,
      month: cellMonth,
      day: cellDay,
      isCurrentMonth: cellMonth === month,
      isToday: ymd === todayKey,
      dayOfWeek: d.getDay(),
      holidayName: holidayMap.get(ymd) ?? null,
    });
  }
  return cells;
}
```

> **注:** `ymd` はローカル日付 (実行環境のタイムゾーン) ベースで組み立てる。`isToday` 判定だけは `today` を Asia/Tokyo の `todayKey` に変換して比較する。サーバー実行時 (UTC) でも、`new Date(year, month, day)` はローカルでの「指定年月日 00:00」を返すため、`getFullYear`/`getMonth`/`getDate` で取り出す限りずれない。サーバーが UTC でも日本ローカル日付の桁を直接組むので問題ない。
>
> もし将来サーバー時刻と表示時刻でずれが報告されたら、ymd 組み立てを `formatYmdInAppTimeZone(d)` に置き換える調整余地あり (今回はテストが通る最小実装で進める)。

- [ ] **Step 4: テスト通過を確認**

Run: `pnpm test src/lib/calendar.test.ts`
期待: 全テスト PASS。

- [ ] **Step 5: コミット**

```bash
git add src/lib/calendar.ts src/lib/calendar.test.ts
git commit -m "feat(calendar): add buildMonthGrid with holiday lookup"
```

---

## Task 5: `expandSubscriptionsToMonth()` と `groupEventsByDate()` を TDD

**Files:**
- Modify: `src/lib/calendar.ts`
- Modify: `src/lib/calendar.test.ts`

- [ ] **Step 1: 失敗するテストを追記**

```typescript
import { expandSubscriptionsToMonth, groupEventsByDate } from './calendar';
import type { Subscription } from './types';

function makeSub(overrides: Partial<Subscription>): Subscription {
  return {
    id: 'sub-1',
    userId: 'u1',
    name: 'Netflix',
    category: 'エンタメ',
    price: 1490,
    billingCycle: 'monthly',
    nextBillingDate: '2026-01-15',
    memo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('expandSubscriptionsToMonth', () => {
  it('expands monthly subscription to every month on anchor day', () => {
    const sub = makeSub({ nextBillingDate: '2026-01-15', billingCycle: 'monthly' });
    const events = expandSubscriptionsToMonth([sub], 2026, 4); // May
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2026-05-15');
    expect(events[0].title).toBe('Netflix');
    expect(events[0].sourceId).toBe('sub-1');
  });

  it('clamps day 31 monthly to last day of February', () => {
    const sub = makeSub({ id: 's2', nextBillingDate: '2026-01-31', billingCycle: 'monthly' });
    const events = expandSubscriptionsToMonth([sub], 2026, 1); // Feb 2026 (28 days)
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2026-02-28');
  });

  it('expands yearly only on anchor month', () => {
    const sub = makeSub({ id: 's3', nextBillingDate: '2026-03-10', billingCycle: 'yearly' });
    const eventsMar = expandSubscriptionsToMonth([sub], 2026, 2); // March
    const eventsApr = expandSubscriptionsToMonth([sub], 2026, 3); // April
    expect(eventsMar).toHaveLength(1);
    expect(eventsMar[0].date).toBe('2026-03-10');
    expect(eventsApr).toHaveLength(0);
  });

  it('expands yearly on anchor month in future years', () => {
    const sub = makeSub({ id: 's4', nextBillingDate: '2024-07-20', billingCycle: 'yearly' });
    const events = expandSubscriptionsToMonth([sub], 2026, 6); // July 2026
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2026-07-20');
  });

  it('returns multiple events for multiple subscriptions', () => {
    const subs = [
      makeSub({ id: 'a', nextBillingDate: '2026-01-10', billingCycle: 'monthly' }),
      makeSub({ id: 'b', nextBillingDate: '2026-01-20', billingCycle: 'monthly' }),
    ];
    const events = expandSubscriptionsToMonth(subs, 2026, 4);
    expect(events).toHaveLength(2);
  });
});

describe('groupEventsByDate', () => {
  it('groups events by date key', () => {
    const events = [
      { date: '2026-05-10', title: 'A', sourceId: '1' },
      { date: '2026-05-10', title: 'B', sourceId: '2' },
      { date: '2026-05-15', title: 'C', sourceId: '3' },
    ];
    const map = groupEventsByDate(events);
    expect(map.get('2026-05-10')).toHaveLength(2);
    expect(map.get('2026-05-15')).toHaveLength(1);
    expect(map.get('2026-05-20')).toBeUndefined();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `pnpm test src/lib/calendar.test.ts`
期待: 関数未定義で FAIL。

- [ ] **Step 3: 実装を追加**

`src/lib/calendar.ts` に追記:

```typescript
import type { CalendarEvent, Subscription } from './types';

export function expandSubscriptionsToMonth(
  subs: Subscription[],
  year: number,
  month: number,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const sub of subs) {
    const [anchorY, anchorM, anchorD] = sub.nextBillingDate.split('-').map(Number);
    if (sub.billingCycle === 'yearly' && anchorM - 1 !== month) {
      continue;
    }
    const lastDay = getLastDayOfMonth(year, month);
    const day = Math.min(anchorD, lastDay);
    const ymd = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    events.push({ date: ymd, title: sub.name, sourceId: sub.id });
  }
  return events;
}

export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return map;
}
```

> **注:** spec は `nextBillingFrom()` を内部利用すると記載しているが、`nextBillingFrom` は「today 以上で最も近い課金日」を 1 つだけ返す関数。**カレンダーは特定月の発生日を返す必要があり、用途が異なる**。本実装ではアンカー日 (`nextBillingDate`) を直接「指定月の発生日」に投影する。月末クランプ仕様は `nextBillingFrom` と同等 (`Math.min(anchorD, lastDay)`)。

- [ ] **Step 4: テスト通過を確認**

Run: `pnpm test src/lib/calendar.test.ts`
期待: 全テスト PASS。

- [ ] **Step 5: コミット**

```bash
git add src/lib/calendar.ts src/lib/calendar.test.ts
git commit -m "feat(calendar): expand subscriptions to month and group by date"
```

---

## Task 6: `CalendarCell` を実装 (純粋表示)

**Files:**
- Create: `src/components/calendar/calendar-cell.tsx`

- [ ] **Step 1: 新規作成**

```tsx
import type { CalendarDay, CalendarEvent } from '@/lib/types';

type Props = {
  day: CalendarDay;
  events: CalendarEvent[];
  bgClass: string;
};

export function CalendarCell({ day, events, bgClass }: Props) {
  const dayTextClass = !day.isCurrentMonth
    ? 'text-gray-300'
    : day.dayOfWeek === 0 || day.holidayName
      ? 'text-red-600'
      : day.dayOfWeek === 6
        ? 'text-blue-600'
        : 'text-stone-800';

  const ringClass = day.isToday ? 'ring-2 ring-blue-400 ring-inset' : '';

  const visible = events.slice(0, 2);
  const overflow = events.length - visible.length;

  return (
    <div className={`min-h-[88px] border border-stone-100 p-1.5 ${bgClass} ${ringClass}`}>
      <div className={`text-xs font-medium ${dayTextClass}`}>{day.day}</div>
      {day.holidayName ? (
        <div className="mt-0.5 truncate text-[10px] text-red-600">{day.holidayName}</div>
      ) : null}
      <div className="mt-1 flex flex-col gap-0.5">
        {visible.map((e) => (
          <div
            key={e.sourceId}
            className="truncate rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-800"
            title={e.title}
          >
            {e.title}
          </div>
        ))}
        {overflow > 0 ? <div className="text-[10px] text-stone-500">+{overflow}</div> : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `pnpm tsc --noEmit`**

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/components/calendar/calendar-cell.tsx
git commit -m "feat(calendar): add CalendarCell display component"
```

---

## Task 7: `CalendarGrid` を実装

**Files:**
- Create: `src/components/calendar/calendar-grid.tsx`

- [ ] **Step 1: 新規作成**

```tsx
import { CalendarCell } from './calendar-cell';
import type { CalendarDay, CalendarEvent } from '@/lib/types';

type Props = {
  days: CalendarDay[];
  eventsByDate: Map<string, CalendarEvent[]>;
};

const WEEK_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

function bgForDayOfWeek(dow: number): string {
  if (dow === 0) return 'bg-red-50';
  if (dow === 6) return 'bg-blue-50';
  return 'bg-white';
}

function headerColor(dow: number): string {
  if (dow === 0) return 'text-red-600';
  if (dow === 6) return 'text-blue-600';
  return 'text-stone-500';
}

export function CalendarGrid({ days, eventsByDate }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="grid grid-cols-7 border-stone-200 border-b">
        {WEEK_LABELS.map((label, i) => (
          <div key={label} className={`px-2 py-2 text-center text-xs font-medium ${headerColor(i)}`}>
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <CalendarCell
            key={day.ymd}
            day={day}
            events={eventsByDate.get(day.ymd) ?? []}
            bgClass={bgForDayOfWeek(day.dayOfWeek)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `pnpm tsc --noEmit`**

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/components/calendar/calendar-grid.tsx
git commit -m "feat(calendar): add CalendarGrid layout"
```

---

## Task 8: `CalendarHeader` を実装 (Client)

**Files:**
- Create: `src/components/calendar/calendar-header.tsx`

- [ ] **Step 1: 新規作成**

```tsx
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
      <h2 className="font-semibold text-lg text-stone-900">
        {year}年 {month + 1}月
      </h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-stone-700 text-xs hover:bg-stone-50"
        >
          前月
        </button>
        <button
          type="button"
          onClick={onToday}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-stone-700 text-xs hover:bg-stone-50"
        >
          今日
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-stone-700 text-xs hover:bg-stone-50"
        >
          翌月
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `pnpm tsc --noEmit`**

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/components/calendar/calendar-header.tsx
git commit -m "feat(calendar): add CalendarHeader with prev/today/next"
```

---

## Task 9: 親 `Calendar` を実装 (Client、月状態)

**Files:**
- Create: `src/components/calendar/calendar.tsx`

- [ ] **Step 1: 新規作成**

```tsx
'use client';

import { useMemo, useState } from 'react';
import {
  buildMonthGrid,
  expandSubscriptionsToMonth,
  groupEventsByDate,
  nextMonth,
  prevMonth,
} from '@/lib/calendar';
import type { Subscription } from '@/lib/types';
import { CalendarGrid } from './calendar-grid';
import { CalendarHeader } from './calendar-header';

type Props = {
  initialSubscriptions: Subscription[];
};

export function Calendar({ initialSubscriptions }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const days = useMemo(() => buildMonthGrid(year, month, new Date()), [year, month]);
  const eventsByDate = useMemo(() => {
    const events = expandSubscriptionsToMonth(initialSubscriptions, year, month);
    return groupEventsByDate(events);
  }, [initialSubscriptions, year, month]);

  function handlePrev() {
    const { year: y, month: m } = prevMonth(year, month);
    setYear(y);
    setMonth(m);
  }

  function handleNext() {
    const { year: y, month: m } = nextMonth(year, month);
    setYear(y);
    setMonth(m);
  }

  function handleToday() {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
  }

  return (
    <div className="flex flex-col gap-4">
      <CalendarHeader
        year={year}
        month={month}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
      />
      <CalendarGrid days={days} eventsByDate={eventsByDate} />
    </div>
  );
}
```

- [ ] **Step 2: `pnpm tsc --noEmit`**

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/components/calendar/calendar.tsx
git commit -m "feat(calendar): add Calendar parent with month state"
```

---

## Task 10: `/calendar` ルート (Server Component) を作成

**Files:**
- Create: `src/app/calendar/page.tsx`

- [ ] **Step 1: 新規作成**

```tsx
import { redirect } from 'next/navigation';
import { Calendar } from '@/components/calendar/calendar';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getSession } from '@/lib/get-session';
import { listAll } from '@/lib/subscriptions';

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const subs = await listAll(session.user.id);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5f2]">
      <Header userName={session.user.name ?? session.user.email} userEmail={session.user.email} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <Calendar initialSubscriptions={subs} />
      </main>

      <Footer />
    </div>
  );
}
```

> **注:** `Header` は `userEmail` props を要求する (マイページ計画 Task 3 で拡張済み)。マイページ計画と本計画を独立に実装する場合は、本計画 Task 10 着手前にマイページ計画 Task 2〜4 を完了させること。**順序依存あり**。

- [ ] **Step 2: `pnpm tsc --noEmit`**

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/app/calendar/page.tsx
git commit -m "feat(calendar): add /calendar route with auth guard"
```

---

## Task 11: Header のカレンダーリンクを有効化

**Files:**
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: ナビゲーションの array map 内を以下に置き換え**

現状:
```tsx
{(['サービス', 'カレンダー', '設定'] as const).map((label) => (
  <Link key={label} href="#" ...>
    {label}
  </Link>
))}
```

差し替え後:
```tsx
{(
  [
    { label: 'サービス', href: '/dashboard' },
    { label: 'カレンダー', href: '/calendar' },
    { label: '設定', href: '/mypage' },
  ] as const
).map((item) => (
  <Link
    key={item.label}
    href={item.href}
    className="rounded-lg px-3 py-1.5 font-medium text-stone-500 text-xs transition-colors hover:bg-stone-100/80 hover:text-stone-900"
  >
    {item.label}
  </Link>
))}
```

- [ ] **Step 2: `pnpm tsc --noEmit` と `pnpm lint`**

期待: エラーなし。

- [ ] **Step 3: コミット**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat(layout): wire header nav links to actual routes"
```

---

## Task 12: 最終チェックと手動検証

**Files:** なし

- [ ] **Step 1: 自動チェック**

Run:
```bash
pnpm test
pnpm tsc --noEmit
pnpm lint
pnpm build
```

期待: すべて成功。`pnpm lint` の差分が出る場合は `pnpm lint --write ./src` を実行して再コミット。

- [ ] **Step 2: dev サーバ起動**

```bash
pnpm dev
```

- [ ] **Step 3: 手動検証チェックリスト**

1. 未ログインで `/calendar` → `/login` リダイレクト
2. ログイン後 `/calendar` で当月カレンダーが表示される
3. グリッドが常に 6 行 = 42 セルである (DevTools で確認)
4. 「前月」「翌月」ボタンで月が切り替わる
5. 12 月 → 翌年 1 月、1 月 → 前年 12 月の年跨ぎが正しい
6. 「今日」ボタンで今月に戻る
7. 今日 (Asia/Tokyo) のセルに青のリングが表示される
8. 日曜列の背景が薄赤、土曜列の背景が薄青、日付文字色も赤/青になっている
9. 5月3日 (憲法記念日) など祝日が赤字で表示され、祝日名がセル内に出る
10. 本人のサブスクが請求日に amber バッジで表示される
11. monthly は毎月、yearly はアンカー月のみ表示
12. アンカー 1/31 monthly サブスクが 2 月では 28 日 (うるう年は 29 日) に表示される
13. 1 セルに 3 件以上ある場合、最初の 2 件 + `+N` 表示
14. ヘッダーの「カレンダー」リンクで `/dashboard` から `/calendar` に遷移できる
15. ダッシュボードのカレンダー表示は変わらず動作する (リグレッションなし)

---

## 受け入れ基準 (Definition of Done)

### 機能
- [ ] 上記手動検証 15 項目すべて通過

### 技術
- [ ] `src/lib/calendar.ts` が純粋関数のみで構成され、React に依存しない
- [ ] `src/lib/calendar.test.ts` が全テスト PASS
- [ ] 日付キー組み立てが `Asia/Tokyo` 基準 (`formatYmdInAppTimeZone` 経由) で `Date#toISOString()` 不使用
- [ ] `'use client'` が `calendar.tsx` / `calendar-header.tsx` のみに付与され、`calendar-grid.tsx` / `calendar-cell.tsx` は Server-compatible
- [ ] `pnpm test` / `pnpm tsc --noEmit` / `pnpm lint` / `pnpm build` がすべて成功
- [ ] ダークモード関連コード (`dark:` クラス、`next-themes` 等) が一切追加されていない
- [ ] Tailwind の動的クラス文字列補間 (`` `bg-${color}-50` ``) を使っていない
- [ ] `package.json` への追加依存が `@holiday-jp/holiday_jp` のみ
- [ ] `src/lib/schema.ts` / DB スキーマに変更がない

### ファイル
- [ ] `src/components/calendar/` 配下が kebab-case (`calendar.tsx` / `calendar-header.tsx` / `calendar-grid.tsx` / `calendar-cell.tsx`)
- [ ] `src/app/calendar/page.tsx` が Server Component
- [ ] 新規テーブルなし

---

## 補足: 判断指針

- **`formatYmdInAppTimeZone` の import 元**: `@/lib/billing` (spec の `@/lib/utils` 記載は誤り)。
- **`expandSubscriptionsToMonth` の実装方針**: `nextBillingFrom()` は「today 以降の最近の課金日 1 件」を返す関数で、特定月のすべての発生日を列挙する用途に合わない。月末クランプの**ルール**だけ揃え、独自に投影する。
- **`'use client'` 境界**: `Calendar` / `CalendarHeader` のみクライアント。`CalendarGrid` / `CalendarCell` は `'use client'` を付けない (純粋表示)。
- **再フェッチなし**: 月送りは `useState` で `(year, month)` を変えるだけ。`initialSubscriptions` は props で受け取り再利用。
- **マイページ計画との順序依存**: 本計画 Task 10 (page.tsx) は `Header` に `userEmail` props が必要。マイページ計画 Task 2〜4 完了後に着手する。
- **CLAUDE.md 準拠**: `pnpm add` を自分で実行しない。`process.env` 直参照禁止 (今回は新規環境変数なし)。Header / Footer のフォントや色のテーマトークンは既存に揃える。

---

## 拡張余地 (今回スコープ外)

- 単発予定テーブル `one_time_events`
- セルクリックで詳細モーダル
- 月合計金額の表示
- 週/日表示
- ICS エクスポート
