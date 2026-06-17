import { useState } from "react";
import { MonthlySummaryEntry } from "../api/types";
import { formatMonthLabel, getCurrentMonthKey } from "../utils/date";
import Modal from "./Modal";

interface MonthlySummaryModalProps {
  title: string;
  entries: MonthlySummaryEntry[];
  onClose: () => void;
}

const prevMonthKey = (month: string): string => {
  const [y, m] = month.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
};

const nextMonthKey = (month: string): string => {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};

export default function MonthlySummaryModal({ title, entries, onClose }: MonthlySummaryModalProps) {
  const [month, setMonth] = useState(getCurrentMonthKey());
  const monthEntries = entries.filter((e) => e.month === month);

  const totalQuantity = monthEntries.reduce((sum, e) => sum + e.quantity, 0);
  const totalPrice = monthEntries.reduce((sum, e) => sum + e.totalPrice, 0);
  const totalPaid = monthEntries.reduce((sum, e) => sum + e.paid, 0);
  const totalRemaining = monthEntries.reduce((sum, e) => sum + e.remaining, 0);

  return (
    <Modal title={title} onClose={onClose}>
      <div className="monthly-nav">
        <button className="nav-arrow" onClick={() => setMonth(prevMonthKey(month))}>
          ◄
        </button>
        <span className="monthly-nav-label">{formatMonthLabel(month)}</span>
        <button className="nav-arrow" onClick={() => setMonth(nextMonthKey(month))}>
          ►
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="label">פריטים שנקנו</div>
          <div className="value">{totalQuantity}</div>
        </div>
        <div className="summary-card">
          <div className="label">שולם</div>
          <div className="value amount-paid">₪{totalPaid}</div>
        </div>
        <div className="summary-card">
          <div className="label">צריך להיכנס</div>
          <div className={`value ${totalRemaining > 0 ? "amount-remaining" : "amount-paid"}`}>
            ₪{totalRemaining}
          </div>
        </div>
        <div className="summary-card">
          <div className="label">הכנסות</div>
          <div className="value">₪{totalPrice}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>שם מוצר</th>
            <th>מחיר ליחידה</th>
            <th>כמות</th>
            <th>סהכ לתשלום</th>
            <th>שולם</th>
            <th>לתשלום</th>
          </tr>
        </thead>
        <tbody>
          {monthEntries.map((e) => (
            <tr key={e.itemName}>
              <td>{e.itemName}</td>
              <td>₪{e.unitPrice}</td>
              <td>{e.quantity}</td>
              <td>₪{e.totalPrice}</td>
              <td className="amount-paid">₪{e.paid}</td>
              <td>
                {e.remaining === 0 ? (
                  <span className="tag-paid">שולם</span>
                ) : (
                  <span className="amount-remaining">₪{e.remaining}</span>
                )}
              </td>
            </tr>
          ))}
          {monthEntries.length === 0 && (
            <tr>
              <td colSpan={6}>אין נתונים לחודש זה</td>
            </tr>
          )}
        </tbody>
      </table>

      {monthEntries.length > 0 && (
        <p className="summary-footer">{monthEntries.length} פריטים</p>
      )}
    </Modal>
  );
}
