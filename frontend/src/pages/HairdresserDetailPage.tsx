import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { hairdressersApi } from "../api/hairdressers";
import { wigsApi } from "../api/wigs";
import { Hairdresser, HairdresserSale, MonthlySummaryEntry, Wig } from "../api/types";
import Modal from "../components/Modal";
import MonthlySummaryModal from "../components/MonthlySummaryModal";
import { GREGORIAN_MONTH_NAMES } from "../utils/date";

const fmt = (n: number) => `₪${n.toLocaleString("he-IL")}`;
const formatDate = (s: string) => {
  const d = new Date(s);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};
const formatMonth = (s: string) => {
  const d = new Date(s);
  return `${GREGORIAN_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};
const catLabel = (c: string) => c === "boutique" ? "בוטיק" : "סטנדרט";

const toEntriesByCategory = (sales: HairdresserSale[]): MonthlySummaryEntry[] => {
  const map = new Map<string, MonthlySummaryEntry>();
  for (const sale of sales) {
    const month = sale.date.slice(0, 7);
    const cat = sale.wig?.category === "boutique" ? "בוטיק" : "סטנדרט";
    const key = `${month}|${cat}`;
    const paid = sale.payments.reduce((s, p) => s + p.amount, 0);
    const e = map.get(key) ?? { month, itemName: cat, unitPrice: 0, quantity: 0, totalPrice: 0, paid: 0, remaining: 0 };
    e.quantity += 1; e.totalPrice += sale.totalPrice; e.paid += paid; e.remaining = e.totalPrice - e.paid;
    map.set(key, e);
  }
  return Array.from(map.values());
};

export default function HairdresserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [hairdresser, setHairdresser] = useState<Hairdresser | null>(null);
  const [sales, setSales] = useState<HairdresserSale[]>([]);
  const [wigs, setWigs] = useState<Wig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [paymentSale, setPaymentSale] = useState<HairdresserSale | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [detail, wigsData] = await Promise.all([
        hairdressersApi.detail(id),
        wigsApi.list(),
      ]);
      setHairdresser(detail.hairdresser);
      setSales(detail.sales);
      setWigs(wigsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleDeleteSale = async (saleId: string) => {
    if (!id || !confirm("למחוק מכירה זו?")) return;
    try {
      await hairdressersApi.deleteSale(id, saleId);
      load();
    } catch (e) { alert(e instanceof Error ? e.message : String(e)); }
  };

  const totalDue = sales.reduce((s, r) => s + r.totalPrice, 0);
  const totalPaid = sales.reduce((s, r) => s + r.payments.reduce((a, p) => a + p.amount, 0), 0);
  const balance = totalDue - totalPaid;


  if (loading) return <div className="page"><p>טוען...</p></div>;
  if (error) return <div className="page"><p className="error">{error}</p></div>;
  if (!hairdresser) return null;

  return (
    <div className="page">
      <div className="toolbar">
        <h1>{hairdresser.firstName} {hairdresser.lastName}</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={() => setShowSummary(true)}>סיכום חודשי</button>
          <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>עריכה</button>
        </div>
      </div>

      <p>טלפון: {hairdresser.phone}{hairdresser.email ? ` | מייל: ${hairdresser.email}` : ""}</p>

      <div className="summary-cards" style={{ marginBottom: "1.5rem" }}>
        <div className="summary-card summary-card--expense">
          <div className="label">סה"כ לתשלום</div>
          <div className="value">{fmt(totalDue)}</div>
        </div>
        <div className="summary-card summary-card--income">
          <div className="label">סה"כ שולם</div>
          <div className="value">{fmt(totalPaid)}</div>
        </div>
        <div className="summary-card summary-card--profit">
          <div className="label">יתרה</div>
          <div className="value">{fmt(balance)}</div>
        </div>
      </div>

      <div className="toolbar">
        <h2 style={{ margin: 0 }}>מכירות</h2>
        <button className="btn" onClick={() => setShowSaleModal(true)}>+ מכירה חדשה</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>פאה</th>
            <th>קטגוריה</th>
            <th>מחיר</th>
            <th>שולם</th>
            <th>יתרה</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => {
            const paid = s.payments.reduce((a, p) => a + p.amount, 0);
            const rem = s.totalPrice - paid;
            return (
              <tr key={s._id}>
                <td>{formatDate(s.date)}</td>
                <td>{s.wig?.name ?? "-"}</td>
                <td>{s.wig ? catLabel(s.wig.category) : "-"}</td>
                <td>{fmt(s.totalPrice)}</td>
                <td className={rem === 0 ? "balance-zero" : "balance-positive"}>{fmt(paid)}</td>
                <td className={rem > 0 ? "balance-positive" : "balance-zero"}>{fmt(rem)}</td>
                <td style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="link-btn" onClick={() => setPaymentSale(s)}>+ תשלום</button>
                  <button className="link-btn link-btn-danger" onClick={() => handleDeleteSale(s._id)}>מחיקה</button>
                </td>
              </tr>
            );
          })}
          {sales.length === 0 && <tr><td colSpan={7}>אין עדיין מכירות</td></tr>}
        </tbody>
      </table>

      {showEdit && (
        <EditHairdresserModal
          hairdresser={hairdresser}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load(); }}
        />
      )}

      {showSaleModal && id && (
        <AddSaleModal
          hairdresserId={id}
          wigs={wigs}
          onClose={() => setShowSaleModal(false)}
          onSaved={() => { setShowSaleModal(false); load(); }}
        />
      )}

      {paymentSale && id && (
        <AddPaymentModal
          hairdresserId={id}
          sale={paymentSale}
          onClose={() => setPaymentSale(null)}
          onSaved={() => { setPaymentSale(null); load(); }}
        />
      )}

      {showSummary && hairdresser && (
        <MonthlySummaryModal
          title={`סיכום חודשי — ${hairdresser.firstName} ${hairdresser.lastName}`}
          entries={toEntriesByCategory(sales)}
          onClose={() => setShowSummary(false)}
          labels={{ itemName: "קטגוריה", unitPrice: null, quantity: "כמות פאות", totalPrice: "סה\"כ", paid: "שולם", remaining: "יתרה",
            cards: { quantity: "פאות שנקנו", paid: "שולם", remaining: "יתרה", total: "סה\"כ" } }}
        />
      )}
    </div>
  );
}

function EditHairdresserModal({ hairdresser, onClose, onSaved }: {
  hairdresser: Hairdresser; onClose: () => void; onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(hairdresser.firstName);
  const [lastName, setLastName] = useState(hairdresser.lastName);
  const [phone, setPhone] = useState(hairdresser.phone);
  const [email, setEmail] = useState(hairdresser.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await hairdressersApi.update(hairdresser._id, { firstName, lastName, phone, email: email || undefined });
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="עריכת פאנית" onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <label>שם פרטי<input value={firstName} onChange={e => setFirstName(e.target.value)} required /></label>
          <label>שם משפחה<input value={lastName} onChange={e => setLastName(e.target.value)} required /></label>
        </div>
        <label>טלפון<input value={phone} onChange={e => setPhone(e.target.value)} required /></label>
        <label>מייל<input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>{saving ? "שומר..." : "שמירה"}</button>
      </form>
    </Modal>
  );
}

function AddSaleModal({ hairdresserId, wigs, onClose, onSaved }: {
  hairdresserId: string; wigs: Wig[]; onClose: () => void; onSaved: () => void;
}) {
  const [wigId, setWigId] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleWigChange = (id: string) => {
    setWigId(id);
    const wig = wigs.find(w => w._id === id);
    if (wig) setPrice(wig.price);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await hairdressersApi.addSale(hairdresserId, {
        wigId,
        totalPrice: Number(price),
        date,
        payment: paymentAmount !== "" && Number(paymentAmount) > 0
          ? { amount: Number(paymentAmount) }
          : undefined,
        note: note || undefined,
      });
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="מכירת פאה לפאנית" onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <label>
          פאה
          <select value={wigId} onChange={e => handleWigChange(e.target.value)} required>
            <option value="">בחרי פאה</option>
            {wigs.map(w => (
              <option key={w._id} value={w._id} disabled={w.quantity <= 0}>
                {w.name} ({catLabel(w.category)}) - {fmt(w.price)}
                {w.quantity <= 0 ? " (אין במלאי)" : ` (${w.quantity} במלאי)`}
              </option>
            ))}
          </select>
        </label>
        <label>
          תאריך מכירה
          <input type="date" value={date} onChange={e => { setDate(e.target.value); e.target.blur(); }} required />
        </label>
        <label>
          מחיר
          <input type="number" value={price} onChange={e => setPrice(e.target.value === "" ? "" : Number(e.target.value))} required />
        </label>
        <label>
          תשלום ראשוני (אופציונלי)
          <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))} />
        </label>
        <label>הערה<textarea value={note} onChange={e => setNote(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>{saving ? "שומר..." : "שמירה"}</button>
      </form>
    </Modal>
  );
}

function AddPaymentModal({ hairdresserId, sale, onClose, onSaved }: {
  hairdresserId: string; sale: HairdresserSale; onClose: () => void; onSaved: () => void;
}) {
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await hairdressersApi.addPayment(hairdresserId, sale._id, { amount: Number(amount), date });
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={`הוספת תשלום — ${sale.wig?.name ?? ""}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <label>
          סכום
          <input type="number" value={amount} onChange={e => setAmount(e.target.value === "" ? "" : Number(e.target.value))} required />
        </label>
        <label>
          תאריך
          <input type="date" value={date} onChange={e => { setDate(e.target.value); e.target.blur(); }} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>{saving ? "שומר..." : "שמירה"}</button>
      </form>
    </Modal>
  );
}
