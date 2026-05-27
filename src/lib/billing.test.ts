import { daysUntilNextBilling, formatYmd, nextBillingFrom, toMonthly, toYearly } from './billing';

describe('formatYmd', () => {
  it('formats UTC date to YYYY-MM-DD with zero padding', () => {
    expect(formatYmd(new Date(Date.UTC(2026, 0, 5)))).toBe('2026-01-05');
    expect(formatYmd(new Date(Date.UTC(2026, 11, 31)))).toBe('2026-12-31');
  });
});

describe('nextBillingFrom (monthly)', () => {
  it('returns anchor when anchor is in the future', () => {
    expect(nextBillingFrom('2026-01-15', 'monthly', '2026-01-10')).toBe('2026-01-15');
  });

  it('returns anchor when anchor equals today', () => {
    expect(nextBillingFrom('2026-01-15', 'monthly', '2026-01-15')).toBe('2026-01-15');
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
  it('returns anchor when anchor is in the future', () => {
    expect(nextBillingFrom('2027-06-01', 'yearly', '2026-01-01')).toBe('2027-06-01');
  });

  it('advances one year when anchor is past', () => {
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
