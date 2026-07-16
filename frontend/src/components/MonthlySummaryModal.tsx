import { useState } from "react";
import { MonthlySummaryEntry } from "../api/types";
import { formatMonthLabel, getCurrentMonthKey } from "../utils/date";
import Modal from "./Modal";

interface ColumnLabels {
  itemName?: string;
  unitPrice?: string | null;
  quantity?: string | null;
  totalPrice?: string;
  paid?: string;
  remaining?: string;
  cards?: {
    quantity?: string | null;
    paid?: string;
    remaining?: string;
    total?: string;
  };
}

interface MonthlySummaryModalProps {
  title: string;
  entries: MonthlySummaryEntry[];
  onClose: () => void;
  labels?: ColumnLabels;
}

const prevMonthKey = (month: string): string => {
  const [y, m] = month.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
};

const nextMonthKey = (month: string): string => {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};

export default function MonthlySummaryModal({ title, entries, onClose, labels = {} }: MonthlySummaryModalProps) {
  const col = {
    itemName:   labels.itemName   ?? "שם מוצר",
    unitPrice:  "unitPrice"  in labels ? labels.unitPrice  : "מחיר ליחידה",
    quantity:   "quantity"   in labels ? labels.quantity   : "כמות",
    totalPrice: labels.totalPrice ?? "סהכ לתשלום",
    paid:       labels.paid       ?? "שולם",
    remaining:  labels.remaining  ?? "לתשלום",
  };
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
          ►
        </button>
        <span className="monthly-nav-label">{formatMonthLabel(month)}</span>
        <button className="nav-arrow" onClick={() => setMonth(nextMonthKey(month))}>
          ◄
        </button>
      </div>

      <div className="summary-cards">
        {labels.cards?.quantity !== null && (
          <div className="summary-card">
            <div className="label">{labels.cards?.quantity ?? "פריטים שנקנו"}</div>
            <div className="value">{totalQuantity}</div>
          </div>
        )}
        <div className="summary-card">
          <div className="label">{labels.cards?.paid ?? "שולם"}</div>
          <div className="value amount-paid">₪{totalPaid}</div>
        </div>
        <div className="summary-card">
          <div className="label">{labels.cards?.remaining ?? "צריך להיכנס"}</div>
          <div className={`value ${totalRemaining > 0 ? "amount-remaining" : "amount-paid"}`}>
            ₪{totalRemaining}
          </div>
        </div>
        <div className="summary-card">
          <div className="label">{labels.cards?.total ?? "הכנסות"}</div>
          <div className="value">₪{totalPrice}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>{col.itemName}</th>
            {col.unitPrice  != null && <th>{col.unitPrice}</th>}
            {col.quantity   != null && <th>{col.quantity}</th>}
            <th>{col.totalPrice}</th>
            <th>{col.paid}</th>
            <th>{col.remaining}</th>
          </tr>
        </thead>
        <tbody>
          {monthEntries.map((e) => (
            <tr key={e.itemName}>
              <td>{e.itemName}</td>
              {col.unitPrice  != null && <td>₪{e.unitPrice}</td>}
              {col.quantity   != null && <td>{e.quantity}</td>}
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
              <td colSpan={col.unitPrice != null && col.quantity != null ? 6 : col.unitPrice != null || col.quantity != null ? 5 : 4}>
                אין נתונים לחודש זה
              </td>
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
