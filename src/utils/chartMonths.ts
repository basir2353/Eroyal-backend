type MonthRow = {
  month: string;
  revenue?: number;
  orders?: number;
  count?: number;
};

/** Pad sparse DB rows into a continuous last-12-months series for charts. */
export function fillLast12Months(rows: MonthRow[]) {
  const byMonth = new Map(rows.map((row) => [row.month, row]));
  const result: MonthRow[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const row = byMonth.get(month);
    result.push({
      month,
      revenue: Number(row?.revenue ?? 0),
      orders: Number(row?.orders ?? 0),
      count: Number(row?.count ?? 0),
    });
  }

  return result;
}
