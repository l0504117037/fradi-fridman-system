import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { hairdressersApi } from "../api/hairdressers";
import { reportsApi } from "../api/reports";
import { Hairdresser, MonthlySummaryReport } from "../api/types";
import Modal from "../components/Modal";
import MonthlySummaryModal from "../components/MonthlySummaryModal";

export default function HairdressersPage() {
  const [hairdressers, setHairdressers] = useState<Hairdresser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryReport | null>(null);

  const openSummary = async () => {
    try { setMonthlySummary(await reportsApi.monthlySummary()); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const load = async (q = search) => {
    setLoading(true);
    setError("");
    try {
      setHairdressers(await hairdressersApi.list(q ? { search: q } : undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(search); }, [search]);

  return (
    <div className="page">
      <div className="toolbar">
        <h1>פאניות</h1>
        <div className="search-box">
          <input
            className="search-input"
            placeholder="חיפוש לפי שם"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="search-reset" onClick={() => setSearch("")}>✕</button>}
        </div>
        <button className="btn btn-secondary" onClick={openSummary}>סיכום חודשי</button>
        <button className="btn" onClick={() => setShowModal(true)}>
          + פאנית חדשה
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p>טוען...</p>}

      <table>
        <thead>
          <tr>
            <th>שם מלא</th>
            <th>טלפון</th>
            <th>מייל</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {hairdressers.map((h) => (
            <tr key={h._id}>
              <td>{h.firstName} {h.lastName}</td>
              <td>{h.phone}</td>
              <td>{h.email || "-"}</td>
              <td>
                <Link to={`/hairdressers/${h._id}`} className="link-btn">
                  כרטיס פאנית
                </Link>
              </td>
            </tr>
          ))}
          {hairdressers.length === 0 && !loading && (
            <tr><td colSpan={4}>אין עדיין פאניות</td></tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <HairdresserFormModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}

      {monthlySummary && (
        <MonthlySummaryModal
          title="סיכום חודשי - פאניות"
          entries={monthlySummary.hairdressersByCategory}
          onClose={() => setMonthlySummary(null)}
          labels={{ itemName: "פאנית — קטגוריה", unitPrice: null, quantity: "כמות פאות", totalPrice: "סה\"כ", paid: "שולם", remaining: "יתרה",
            cards: { quantity: "פאות שנקנו", paid: "שולם", remaining: "יתרה", total: "סה\"כ" } }}
        />
      )}
    </div>
  );
}

function HairdresserFormModal({
  existing,
  onClose,
  onSaved,
}: {
  existing?: Hairdresser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(existing?.firstName ?? "");
  const [lastName, setLastName] = useState(existing?.lastName ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (existing) {
        await hairdressersApi.update(existing._id, { firstName, lastName, phone, email: email || undefined });
      } else {
        await hairdressersApi.create({ firstName, lastName, phone, email: email || undefined });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={existing ? "עריכת פאנית" : "פאנית חדשה"} onClose={onClose}>
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
