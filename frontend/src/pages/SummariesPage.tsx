import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { reportsApi } from "../api/reports";
import { YearlySummaryMonth } from "../api/types";
import { GREGORIAN_MONTH_NAMES, SHORT_MONTH_NAMES } from "../utils/date";

// ──────────────── helpers ────────────────

const getYears = (months: YearlySummaryMonth[]): number[] => {
  const years = new Set<number>([new Date().getFullYear()]);
  for (const m of months) years.add(Number(m.month.split("-")[0]));
  return Array.from(years).sort((a, b) => b - a);
};

const getMonthsForYear = (months: YearlySummaryMonth[], year: number): YearlySummaryMonth[] => {
  const byMonth = new Map(months.filter((m) => m.month.startsWith(`${year}-`)).map((m) => [m.month, m]));
  return Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    return byMonth.get(key) ?? { month: key, incomeReceived: 0, incomeCommitted: 0, expenses: 0, profit: 0, categories: [] };
  });
};

const fmt = (n: number) => `₪${n.toLocaleString("he-IL")}`;
const fmtK = (n: number) => (n >= 1000 ? `₪${(n / 1000).toFixed(0)}k` : `₪${n}`);

// ──────────────── sub-components ────────────────

function MonthDetail({
  data,
  onClose,
}: {
  data: YearlySummaryMonth;
  onClose: () => void;
}) {
  const [y, m] = data.month.split("-");
  const label = `${GREGORIAN_MONTH_NAMES[Number(m) - 1]} ${y}`;

  return (
    <div className="month-detail">
      <div className="month-detail-header">
        <span className="month-detail-title">{label} — פירוט</span>
        <button className="month-detail-close" onClick={onClose}>✕ סגור</button>
      </div>

      <div className="summary-cards">
        <div className="summary-card summary-card--income">
          <div className="label">הכנסות</div>
          <div className="value">{fmt(data.incomeReceived)}</div>
        </div>
        <div className="summary-card summary-card--expense">
          <div className="label">הוצאות</div>
          <div className="value">{fmt(data.expenses)}</div>
        </div>
        <div className="summary-card summary-card--profit">
          <div className="label">רווח</div>
          <div className="value">{fmt(data.profit)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>סוג</th>
            <th>סכום</th>
            <th>קטגוריה</th>
          </tr>
        </thead>
        <tbody>
          {data.categories.map((cat) => (
            <tr key={cat.label}>
              <td>
                <span className={cat.type === "income" ? "tag-income" : "tag-expense"}>
                  {cat.type === "income" ? "הכנסה" : "הוצאה"}
                </span>
              </td>
              <td>{fmt(cat.amount)}</td>
              <td>{cat.label}</td>
            </tr>
          ))}
          {data.categories.length === 0 && (
            <tr><td colSpan={3}>אין נתונים לחודש זה</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ──────────────── main page ────────────────

export default function SummariesPage() {
  const [allMonths, setAllMonths] = useState<YearlySummaryMonth[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    reportsApi
      .yearlySummary()
      .then((r) => setAllMonths(r.months))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const years = useMemo(() => getYears(allMonths), [allMonths]);
  const yearMonths = useMemo(() => getMonthsForYear(allMonths, year), [allMonths, year]);

  const yearTotals = useMemo(
    () => yearMonths.reduce(
      (acc, m) => ({
        incomeReceived: acc.incomeReceived + m.incomeReceived,
        expenses: acc.expenses + m.expenses,
        profit: acc.profit + m.profit,
      }),
      { incomeReceived: 0, expenses: 0, profit: 0 }
    ),
    [yearMonths]
  );

  const yearCategories = useMemo(() => {
    const map = new Map<string, { label: string; amount: number; type: "income" | "expense" }>();
    for (const m of yearMonths) {
      for (const cat of m.categories) {
        const ex = map.get(cat.label);
        if (ex) ex.amount += cat.amount;
        else map.set(cat.label, { ...cat });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.type !== b.type) return a.type === "income" ? -1 : 1;
      return b.amount - a.amount;
    });
  }, [yearMonths]);

  const chartData = yearMonths.map((m, i) => ({
    name: SHORT_MONTH_NAMES[i],
    הכנסות: m.incomeReceived,
    הוצאות: m.expenses,
    month: m.month,
  }));

  const selectedData = selectedMonth ? yearMonths.find((m) => m.month === selectedMonth) ?? null : null;

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    setSelectedMonth(null);
  };

  const handleMonthClick = (month: string) => {
    setSelectedMonth((prev) => (prev === month ? null : month));
  };

  return (
    <div className="page">
      {error && <p className="error">{error}</p>}
      {loading && <p>טוען...</p>}

      {/* Year navigation – always at the top */}
      <div className="year-nav">
        <button className="nav-arrow" onClick={() => handleYearChange(year - 1)}>►</button>
        <span className="year-nav-label">{year}</span>
        <button className="nav-arrow" onClick={() => handleYearChange(year + 1)}>◄</button>
        <div className="year-legend">
          <span className="legend-dot legend-dot--income" /> הכנסות
          <span className="legend-dot legend-dot--expense" /> הוצאות
        </div>
      </div>

      {/* Bar chart */}
      <div className="yearly-chart">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={2} barSize={14}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} width={48} />
            <Tooltip formatter={(val) => (typeof val === "number" ? fmt(val) : val)} />
            <Bar dataKey="הכנסות" fill="#00b894" radius={[3, 3, 0, 0]} />
            <Bar dataKey="הוצאות" fill="#e17055" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail panel – appears below chart when a month is selected */}
      {selectedData && (
        <MonthDetail data={selectedData} onClose={() => setSelectedMonth(null)} />
      )}

      {/* Month grid */}
      <div className="month-grid">
        {yearMonths.map((m, i) => {
          const hasData = m.incomeReceived > 0 || m.expenses > 0;
          const isSelected = m.month === selectedMonth;
          return (
            <div
              key={m.month}
              className={`month-cell ${isSelected ? "month-cell--selected" : ""} ${!hasData ? "month-cell--empty" : ""}`}
              onClick={() => hasData && handleMonthClick(m.month)}
            >
              <div className="month-cell-name">{GREGORIAN_MONTH_NAMES[i]}</div>
              {hasData ? (
                <>
                  <div className="month-cell-income">{fmt(m.incomeReceived)}</div>
                  <div className="month-cell-expenses">{fmt(m.expenses)}</div>
                </>
              ) : (
                <div className="month-cell-empty">-</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Yearly totals – at the bottom */}
      <div className="summary-cards" style={{ marginTop: "1rem" }}>
        <div className="summary-card summary-card--income">
          <div className="label">סה&quot;כ הכנסות</div>
          <div className="value">{fmt(yearTotals.incomeReceived)}</div>
        </div>
        <div className="summary-card summary-card--expense">
          <div className="label">סה&quot;כ הוצאות</div>
          <div className="value">{fmt(yearTotals.expenses)}</div>
        </div>
        <div className="summary-card summary-card--profit">
          <div className="label">רווח נקי</div>
          <div className="value">{fmt(yearTotals.profit)}</div>
        </div>
      </div>

      {/* Yearly breakdown by category */}
      {yearCategories.length > 0 && (
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
          {/* הכנסות */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <h3 style={{ margin: "0 0 0.5rem" }}>פירוט הכנסות</h3>
            <table>
              <thead><tr><th>קטגוריה</th><th>סכום</th></tr></thead>
              <tbody>
                {yearCategories.filter(c => c.type === "income").map(c => (
                  <tr key={c.label}>
                    <td>{c.label}</td>
                    <td className="amount-paid">{fmt(c.amount)}</td>
                  </tr>
                ))}
                {yearCategories.filter(c => c.type === "income").length === 0 && (
                  <tr><td colSpan={2}>אין נתונים</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* הוצאות */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <h3 style={{ margin: "0 0 0.5rem" }}>פירוט הוצאות</h3>
            <table>
              <thead><tr><th>קטגוריה</th><th>סכום</th></tr></thead>
              <tbody>
                {yearCategories.filter(c => c.type === "expense").map(c => (
                  <tr key={c.label}>
                    <td>{c.label}</td>
                    <td className="amount-remaining">{fmt(c.amount)}</td>
                  </tr>
                ))}
                {yearCategories.filter(c => c.type === "expense").length === 0 && (
                  <tr><td colSpan={2}>אין נתונים</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
