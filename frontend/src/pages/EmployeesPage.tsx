import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { employeesApi } from "../api/employees";
import { reportsApi } from "../api/reports";
import { Employee, MonthlySummaryReport } from "../api/types";
import Modal from "../components/Modal";
import MonthlySummaryModal from "../components/MonthlySummaryModal";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
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
      setEmployees(await employeesApi.list(q ? { search: q } : undefined));
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
        <h1>עובדות</h1>
        <div className="search-box">
          <input className="search-input" placeholder="חיפוש לפי שם עובדת" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="search-reset" onClick={() => setSearch("")}>✕</button>}
        </div>
        <button className="btn btn-secondary" onClick={openSummary}>סיכום חודשי</button>
        <button className="btn" onClick={() => setShowModal(true)}>
          + עובדת חדשה
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
            <th>שכר שעתי</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => (
            <tr key={e._id}>
              <td>{e.firstName} {e.lastName}</td>
              <td>{e.phone}</td>
              <td>{e.email}</td>
              <td>₪{e.hourlyRate}</td>
              <td>
                <Link to={`/employees/${e._id}`} className="link-btn">
                  כרטיס עובדת
                </Link>
              </td>
            </tr>
          ))}
          {employees.length === 0 && !loading && (
            <tr>
              <td colSpan={5}>אין עדיין עובדות</td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <EmployeeFormModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}

      {monthlySummary && (
        <MonthlySummaryModal
          title="סיכום חודשי - עובדות"
          entries={monthlySummary.employees}
          onClose={() => setMonthlySummary(null)}
          labels={{ itemName: "שם עובדת", unitPrice: "מחיר לשעה", quantity: "שעות", totalPrice: "משכורת חודשית", paid: "שולם", remaining: "יתרה",
            cards: { quantity: null, paid: "שולם", remaining: "צריך לשלם", total: "משכורות" } }}
        />
      )}
    </div>
  );
}

function EmployeeFormModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await employeesApi.create({
        firstName,
        lastName,
        phone,
        email,
        hourlyRate: Number(hourlyRate),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="עובדת חדשה" onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <label>
            שם פרטי
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </label>
          <label>
            שם משפחה
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </label>
        </div>
        <label>
          טלפון
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label>
          מייל
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          שכר שעתי (₪)
          <input
            type="number"
            min="0"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>
          {saving ? "שומר..." : "שמירה"}
        </button>
      </form>
    </Modal>
  );
}
