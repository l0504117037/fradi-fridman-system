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
    return byMonth.get(key) ?? { month: key, income: 0, expenses: 0, profit: 0, categories: [] };
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
        <span className="month-detail-title">
          {label} — פירוט
        </span>
        <button className="month-detail-close" onClick={onClose}>
          ✕ סגור
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card summary-card--income">
          <div className="label">הכנסות</div>
          <div className="value">{fmt(data.income)}</div>
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
            <tr>
              <td colSpan={3}>אין נתונים לחודש זה</td>
            </tr>
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
      (acc, m) => ({ income: acc.income + m.income, expenses: acc.expenses + m.expenses, profit: acc.profit + m.profit }),
      { income: 0, expenses: 0, profit: 0 }
    ),
    [yearMonths]
  );

  const chartData = yearMonths.map((m, i) => ({
    name: SHORT_MONTH_NAMES[i],
    הכנסות: m.income,
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
      <div className="toolbar">
        <h1>סיכומים</h1>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p>טוען...</p>}

      {/* Year navigation */}
      <div className="year-nav">
        <button className="nav-arrow" onClick={() => handleYearChange(year + 1)}>◄</button>
        <span className="year-nav-label">{year}</span>
        <button className="nav-arrow" onClick={() => handleYearChange(year - 1)}>►</button>
        <div className="year-legend">
          <span className="legend-dot legend-dot--income" /> הכנסות
          <span className="legend-dot legend-dot--expense" /> הוצאות
        </div>
      </div>

      {/* Detail panel OR bar chart */}
      {selectedData ? (
        <MonthDetail data={selectedData} onClose={() => setSelectedMonth(null)} />
      ) : (
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
      )}

      {/* Month grid */}
      <div className="month-grid">
        {yearMonths.map((m, i) => {
          const hasData = m.income > 0 || m.expenses > 0;
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
                  <div className="month-cell-income">{fmt(m.income)}</div>
                  <div className="month-cell-expenses">{fmt(m.expenses)}</div>
                </>
              ) : (
                <div className="month-cell-empty">-</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Yearly totals */}
      <div className="summary-cards" style={{ marginTop: "1rem" }}>
        <div className="summary-card summary-card--income">
          <div className="label">סה&quot;כ הכנסות</div>
          <div className="value">{fmt(yearTotals.income)}</div>
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
    </div>
  );
}
