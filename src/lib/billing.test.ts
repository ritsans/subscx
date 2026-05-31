import {
  daysUntilNextBilling,
  formatYmd,
  formatYmdInAppTimeZone,
  nextBillingFrom,
  toMonthly,
  toYearly,
} from './billing';

describe('formatYmd', () => {
  it('formats UTC date to YYYY-MM-DD with zero padding', () => {
    expect(formatYmd(new Date(Date.UTC(2026, 0, 5)))).toBe('2026-01-05');
    expect(formatYmd(new Date(Date.UTC(2026, 11, 31)))).toBe('2026-12-31');
  });
});

describe('formatYmdInAppTimeZone', () => {
  it('formats dates using Japan time instead of UTC', () => {
    expect(formatYmdInAppTimeZone(new Date('2026-05-26T23:00:00.000Z'))).toBe('2026-05-27');
  });

  it('keeps the previous Japan date before midnight', () => {
    expect(formatYmdInAppTimeZone(new Date('2026-05-26T14:59:59.000Z'))).toBe('2026-05-26');
  });
});

describe('nextBillingFrom (monthly)', () => {
  // 未来アンカーでも today の月に候補日を作り、過去なら翌月へ
  it('uses current month when anchor day is still ahead (future anchor)', () => {
    // ChatGPT 実例: 2026-07-19 アンカー, today 2026-05-30 → 毎月19日 → 2026-05-30 < 19日なので 2026-05-19? → 候補2026-05-19 < today → 翌月 2026-06-19
    expect(nextBillingFrom('2026-07-19', 'monthly', '2026-05-30')).toBe('2026-06-19');
  });

  it('uses current month when anchor day is still ahead this month', () => {
    // today の月の候補日 >= today なら today の月を返す
    expect(nextBillingFrom('2026-01-15', 'monthly', '2026-01-10')).toBe('2026-01-15');
  });

  it('returns today when anchor day equals today', () => {
    expect(nextBillingFrom('2026-01-15', 'monthly', '2026-01-15')).toBe('2026-01-15');
  });

  // Claude 実例: 2027-05-12 アンカー, today 2026-05-30 → 毎月12日 → 2026-05-12 < today → 2026-06-12
  it('handles far-future yearly anchor for monthly cycle (Claude example)', () => {
    expect(nextBillingFrom('2027-05-12', 'monthly', '2026-05-30')).toBe('2026-06-12');
  });

  // 年境界: 12月アンカーで today が 12月末 → 翌年1月
  it('wraps to next year in December', () => {
    expect(nextBillingFrom('2026-12-15', 'monthly', '2026-12-20')).toBe('2027-01-15');
  });

  it('advances one month when anchor is just past', () => {
    expect(nextBillingFrom('2026-01-15', 'monthly', '2026-01-20')).toBe('2026-02-15');
  });

  it('advances multiple months when anchor is well past', () => {
    expect(nextBillingFrom('2026-01-15', 'monthly', '2026-07-01')).toBe('2026-07-15');
  });

  it('clamps to end of month when target month is shorter (Jan 31 -> Feb 28 in non-leap year)', () => {
    expect(nextBillingFrom('2026-01-31', 'monthly', '2026-02-01')).toBe('2026-02-28');
  });

  it('clamps to end of month in leap year February (Jan 31 -> Feb 29 in 2024)', () => {
    expect(nextBillingFrom('2024-01-31', 'monthly', '2024-02-01')).toBe('2024-02-29');
  });

  it('returns to original day after passing a short month (Jan 31 -> Feb 28 -> Mar 31)', () => {
    expect(nextBillingFrom('2026-01-31', 'monthly', '2026-03-01')).toBe('2026-03-31');
  });
});

describe('nextBillingFrom (yearly)', () => {
  // 未来アンカーでも today の年に当てた候補日 (2026-06-01) が today 以上なら今年を返す
  it('uses current year when anchor month/day is still ahead this year', () => {
    expect(nextBillingFrom('2027-06-01', 'yearly', '2026-01-01')).toBe('2026-06-01');
  });

  // today より前の月/日は翌年へ
  it('advances to next year when anchor month/day has already passed this year', () => {
    expect(nextBillingFrom('2025-06-01', 'yearly', '2026-07-01')).toBe('2027-06-01');
  });

  it('advances one year when anchor is past (same month/day earlier in year)', () => {
    expect(nextBillingFrom('2025-06-01', 'yearly', '2026-01-01')).toBe('2026-06-01');
  });

  it('clamps Feb 29 to Feb 28 in non-leap year', () => {
    expect(nextBillingFrom('2024-02-29', 'yearly', '2025-01-01')).toBe('2025-02-28');
  });

  it('keeps Feb 29 when target year is also leap', () => {
    expect(nextBillingFrom('2024-02-29', 'yearly', '2028-01-01')).toBe('2028-02-29');
  });
});

describe('daysUntilNextBilling', () => {
  it('returns 0 when next billing is today', () => {
    expect(daysUntilNextBilling('2026-01-15', 'monthly', '2026-01-15')).toBe(0);
  });

  it('returns 7 when next billing is 7 days away', () => {
    expect(daysUntilNextBilling('2026-01-15', 'monthly', '2026-01-08')).toBe(7);
  });

  it('returns 8 when next billing is 8 days away (above threshold)', () => {
    expect(daysUntilNextBilling('2026-01-15', 'monthly', '2026-01-07')).toBe(8);
  });

  it('returns 1 when next billing is tomorrow', () => {
    expect(daysUntilNextBilling('2026-01-15', 'monthly', '2026-01-14')).toBe(1);
  });
});

describe('toMonthly', () => {
  it('returns price as-is for monthly cycle', () => {
    expect(toMonthly(1490, 'monthly')).toBe(1490);
  });

  it('divides yearly price by 12 and floors', () => {
    expect(toMonthly(5900, 'yearly')).toBe(491);
  });

  it('handles exact division', () => {
    expect(toMonthly(12000, 'yearly')).toBe(1000);
  });
});

describe('toYearly', () => {
  it('multiplies monthly price by 12', () => {
    expect(toYearly(1490, 'monthly')).toBe(17880);
  });

  it('returns yearly price as-is', () => {
    expect(toYearly(5900, 'yearly')).toBe(5900);
  });
});
