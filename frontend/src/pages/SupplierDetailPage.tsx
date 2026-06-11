import { FormEvent, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { suppliersApi } from "../api/suppliers";
import { Supplier, SupplierTransaction } from "../api/types";
import Modal from "../components/Modal";

const today = () => new Date().toISOString().slice(0, 10);

const TYPE_LABELS: Record<SupplierTransaction["type"], string> = {
  purchase: "קנייה",
  return: "החזרה",
  payment: "תשלום",
};

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      setSupplier(await suppliersApi.get(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading && !supplier) return <p>טוען...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!supplier) return null;

  const summary = supplier.summary ?? { totalPurchased: 0, totalReturned: 0, totalPaid: 0, balance: 0 };
  const transactions = [...supplier.transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="page">
      <Link to="/suppliers" className="back-link">
        &rarr; חזרה לספקים
      </Link>

      <div className="toolbar">
        <h1>{supplier.name}</h1>
        <button className="btn" onClick={() => setShowModal(true)}>
          + הוספת תנועה
        </button>
      </div>
      <p>
        טלפון: {supplier.phone || "-"} | מייל: {supplier.email || "-"} | כתובת: {supplier.address || "-"}
      </p>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="label">סה"כ קניות</div>
          <div className="value">{summary.totalPurchased}₪</div>
        </div>
        <div className="summary-card">
          <div className="label">סה"כ החזרות</div>
          <div className="value">{summary.totalReturned}₪</div>
        </div>
        <div className="summary-card">
          <div className="label">סה"כ שולם</div>
          <div className="value">{summary.totalPaid}₪</div>
        </div>
        <div className="summary-card">
          <div className="label">יתרה לתשלום</div>
          <div className={`value ${summary.balance > 0 ? "balance-positive" : "balance-zero"}`}>
            {summary.balance}₪
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>סוג</th>
            <th>סכום</th>
            <th>הערה</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => (
            <tr key={t._id ?? i}>
              <td>{new Date(t.date).toLocaleDateString("he-IL")}</td>
              <td>{TYPE_LABELS[t.type]}</td>
              <td>{t.amount}₪</td>
              <td>{t.note || "-"}</td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={4}>אין עדיין תנועות מול הספק</td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <AddTransactionModal
          supplierId={supplier._id}
          onClose={() => setShowModal(false)}
          onDone={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function AddTransactionModal({
  supplierId,
  onClose,
  onDone,
}: {
  supplierId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [type, setType] = useState<SupplierTransaction["type"]>("purchase");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (amount === "" || Number(amount) <= 0) {
      setError("יש להזין סכום");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await suppliersApi.addTransaction(supplierId, { type, amount: Number(amount), date, note: note || undefined });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="הוספת תנועה מול הספק" onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <label>
          סוג
          <select value={type} onChange={(e) => setType(e.target.value as SupplierTransaction["type"])}>
            <option value="purchase">קנייה מהספק</option>
            <option value="return">החזרה לספק</option>
            <option value="payment">תשלום לספק</option>
          </select>
        </label>
        <label>
          סכום
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </label>
        <label>
          תאריך
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          הערה
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>
          {saving ? "שומר..." : "שמירה"}
        </button>
      </form>
    </Modal>
  );
}
