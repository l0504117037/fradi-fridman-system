import { Fragment, FormEvent, useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { customersApi } from "../api/customers";
import { CustomerHistory, HistoryItem, Product, Wig } from "../api/types";
import Modal from "../components/Modal";
import AppointmentActionModal from "../components/AppointmentActionModal";

const today = () => new Date().toISOString().slice(0, 10);

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<CustomerHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showActionModal, setShowActionModal] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<HistoryItem | null>(null);
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set());

  const highlightKind = searchParams.get("highlightKind");
  const highlightId = searchParams.get("highlightId");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      setData(await customersApi.history(id));
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

  useEffect(() => {
    if (!data || !highlightKind || !highlightId) return;
    const el = document.getElementById(`history-${highlightKind}-${highlightId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [data, highlightKind, highlightId]);

  if (loading && !data) return <p>טוען...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return null;

  const { customer, history } = data;

  const togglePayments = (itemId: string) => {
    setExpandedPayments((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleDeleteItem = async (item: HistoryItem) => {
    if (!window.confirm("למחוק פעולה זו? היא תימחק גם מלוח השנה והמלאי יוחזר אם רלוונטי.")) return;
    try {
      if (item.kind === "purchase") {
        await customersApi.deletePurchase(customer._id, item._id);
      } else {
        await customersApi.deleteServiceRecord(customer._id, item._id);
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="page">
      <Link to="/customers" className="back-link">
        &rarr; חזרה ללקוחות
      </Link>

      <div className="toolbar">
        <h1>
          {customer.firstname} {customer.lastname}
        </h1>
        <button className="btn" onClick={() => setShowActionModal(true)}>
          + הוסף פעולה
        </button>
      </div>
      <p>
        טלפון: {customer.phone} | מייל: {customer.mail}
      </p>

      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>סוג</th>
            <th>פריט / שירות</th>
            <th>מחיר</th>
            <th>שולם</th>
            <th>יתרה</th>
            <th>אחריות עד</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => {
            const isHighlighted = highlightKind === item.kind && highlightId === item._id;
            const isExpanded = expandedPayments.has(item._id);
            return (
              <Fragment key={item._id}>
                <tr
                  id={`history-${item.kind}-${item._id}`}
                  className={isHighlighted ? "history-row highlighted" : "history-row"}
                >
                  <td>{new Date(item.date).toLocaleDateString("he-IL")}</td>
                  <td>{kindLabel(item)}</td>
                  <td>{itemName(item)}</td>
                  <td>{(item.kind === "purchase" ? item.totalPrice : item.price) ?? "-"}</td>
                  <td>{item.paid}</td>
                  <td className={item.balance > 0 ? "balance-positive" : "balance-zero"}>{item.balance}</td>
                  <td>{item.warrantyEnd ? new Date(item.warrantyEnd).toLocaleDateString("he-IL") : "-"}</td>
                  <td>
                    {item.balance > 0 && (
                      <button className="link-btn" onClick={() => setPaymentTarget(item)}>
                        הוסף תשלום
                      </button>
                    )}{" "}
                    <button className="link-btn" onClick={() => togglePayments(item._id)}>
                      {isExpanded ? "הסתר תשלומים" : "הצג תשלומים"}
                    </button>{" "}
                    <button className="link-btn link-btn-danger" onClick={() => handleDeleteItem(item)}>
                      מחיקה
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="payments-row">
                    <td colSpan={8}>
                      {item.payments.length === 0 ? (
                        <span className="no-payments">אין עדיין תשלומים</span>
                      ) : (
                        <table className="payments-table">
                          <thead>
                            <tr>
                              <th>תאריך</th>
                              <th>סכום</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.payments.map((p, idx) => (
                              <tr key={idx}>
                                <td>{new Date(p.date).toLocaleDateString("he-IL")}</td>
                                <td>{p.amount}₪</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {history.length === 0 && (
            <tr>
              <td colSpan={8}>אין עדיין היסטוריה ללקוחה זו</td>
            </tr>
          )}
        </tbody>
      </table>

      {showActionModal && (
        <AppointmentActionModal
          fixedCustomer={customer}
          initialDate={today()}
          initialTime=""
          onClose={() => setShowActionModal(false)}
          onDone={() => {
            setShowActionModal(false);
            load();
          }}
        />
      )}

      {paymentTarget && (
        <AddPaymentModal
          customerId={customer._id}
          item={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onDone={() => {
            setPaymentTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function kindLabel(item: HistoryItem): string {
  if (item.kind === "service") return "שירות";
  return item.itemType === "Wig" ? "פאה" : "מוצר";
}

function itemName(item: HistoryItem): string {
  if (item.kind === "purchase") {
    const it = item.item as (Product & { name?: string }) | (Wig & { type?: string }) | undefined;
    if (!it) return "-";
    return item.itemType === "Wig" ? (it as Wig).name : (it as Product).type;
  }
  return item.service?.name ?? "-";
}

// =====================================================
// הוספת תשלום לפעולה קיימת
// =====================================================

function AddPaymentModal({
  customerId,
  item,
  onClose,
  onDone,
}: {
  customerId: string;
  item: HistoryItem;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(today());
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
      if (item.kind === "purchase") {
        await customersApi.addPurchasePayment(customerId, item._id, { amount: Number(amount), date });
      } else {
        await customersApi.addServicePayment(customerId, item._id, { amount: Number(amount), date });
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`הוספת תשלום (יתרה נוכחית: ${item.balance}₪)`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
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
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>
          {saving ? "שומר..." : "שמירה"}
        </button>
      </form>
    </Modal>
  );
}
