import { FormEvent, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { employeesApi } from "../api/employees";
import { Employee, EmployeeMonthly } from "../api/types";
import Modal from "../components/Modal";
import { GREGORIAN_MONTH_NAMES } from "../utils/date";

const fmt = (n: number) => `₪${n.toLocaleString("he-IL")}`;

const formatMonth = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${GREGORIAN_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [monthly, setMonthly] = useState<EmployeeMonthly[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EmployeeMonthly | null>(null);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [emp, monthlyRes] = await Promise.all([
        employeesApi.get(id),
        employeesApi.getMonthly(id),
      ]);
      setEmployee(emp);
      setMonthly([...monthlyRes.months].sort((a, b) => b.date.localeCompare(a.date)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleDeleteRecord = async (recId: string) => {
    if (!confirm("למחוק רשומה זו?")) return;
    try {
      await employeesApi.deleteMonthly(recId);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const totalDue = monthly.reduce((s, r) => s + r.salaryDue, 0);
  const totalPaid = monthly.reduce((s, r) => s + r.salaryPaid, 0);
  const balance = totalDue - totalPaid;

  if (loading) return <div className="page"><p>טוען...</p></div>;
  if (error) return <div className="page"><p className="error">{error}</p></div>;
  if (!employee) return null;

  return (
    <div className="page">


      <div className="toolbar">
        <h1>{employee.firstName} {employee.lastName}</h1>
        <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>
          עריכה
        </button>
      </div>

      <div className="summary-section">
        <p>טלפון: {employee.phone} | מייל: {employee.email} | שכר שעתי: {fmt(employee.hourlyRate)}</p>
      </div>

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
          <div className={`value ${balance > 0 ? "" : ""}`}>{fmt(balance)}</div>
        </div>
      </div>

      <div className="toolbar">
        <h2 style={{ margin: 0 }}>רשומות חודשיות</h2>
        <button
          className="btn"
          onClick={() => { setEditingRecord(null); setShowMonthlyModal(true); }}
        >
          + רשומה חדשה
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>חודש</th>
            <th>שעות עבודה</th>
            <th>שכר לתשלום</th>
            <th>שולם</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {monthly.map((r) => (
            <tr key={r._id}>
              <td>{formatMonth(r.date)}</td>
              <td>{r.hoursWorked}</td>
              <td>{fmt(r.salaryDue)}</td>
              <td className={r.salaryPaid >= r.salaryDue ? "balance-zero" : "balance-positive"}>
                {fmt(r.salaryPaid)}
              </td>
              <td style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="link-btn"
                  onClick={() => { setEditingRecord(r); setShowMonthlyModal(true); }}
                >
                  עריכה
                </button>
                <button
                  className="link-btn link-btn-danger"
                  onClick={() => handleDeleteRecord(r._id)}
                >
                  מחיקה
                </button>
              </td>
            </tr>
          ))}
          {monthly.length === 0 && (
            <tr><td colSpan={5}>אין עדיין רשומות</td></tr>
          )}
        </tbody>
      </table>

      {showEditModal && (
        <EditEmployeeModal
          employee={employee}
          onClose={() => setShowEditModal(false)}
          onSaved={() => { setShowEditModal(false); load(); }}
        />
      )}

      {showMonthlyModal && (
        <MonthlyRecordModal
          employeeId={employee._id}
          existing={editingRecord}
          onClose={() => setShowMonthlyModal(false)}
          onSaved={() => { setShowMonthlyModal(false); load(); }}
        />
      )}
    </div>
  );
}

function EditEmployeeModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: Employee;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(employee.firstName);
  const [lastName, setLastName] = useState(employee.lastName);
  const [phone, setPhone] = useState(employee.phone);
  const [email, setEmail] = useState(employee.email);
  const [hourlyRate, setHourlyRate] = useState(String(employee.hourlyRate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await employeesApi.update(employee._id, {
        firstName, lastName, phone, email, hourlyRate: Number(hourlyRate),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="עריכת פרטי עובדת" onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <label>שם פרטי<input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></label>
          <label>שם משפחה<input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></label>
        </div>
        <label>טלפון<input value={phone} onChange={(e) => setPhone(e.target.value)} required /></label>
        <label>מייל<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>
          שכר שעתי (₪)
          <input type="number" min="0" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>{saving ? "שומר..." : "שמירה"}</button>
      </form>
    </Modal>
  );
}

function MonthlyRecordModal({
  employeeId,
  existing,
  onClose,
  onSaved,
}: {
  employeeId: string;
  existing: EmployeeMonthly | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initMonth = existing
    ? existing.date.slice(0, 7)
    : new Date().toISOString().slice(0, 7);

  const [month, setMonth] = useState(initMonth);
  const [hoursWorked, setHoursWorked] = useState(existing ? String(existing.hoursWorked) : "");
  const [salaryPaid, setSalaryPaid] = useState(existing ? String(existing.salaryPaid) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const date = `${month}-01`;
    try {
      if (existing) {
        await employeesApi.updateMonthly({
          employeeId,
          date,
          hoursWorked: Number(hoursWorked),
          salaryPaid: Number(salaryPaid),
        });
      } else {
        await employeesApi.createMonthly({
          employee: employeeId,
          date,
          hoursWorked: Number(hoursWorked),
          salaryPaid: Number(salaryPaid),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={existing ? "עריכת רשומה חודשית" : "רשומה חודשית חדשה"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <label>
          חודש
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
            disabled={!!existing}
          />
        </label>
        <label>
          שעות עבודה
          <input
            type="number"
            min="0"
            value={hoursWorked}
            onChange={(e) => setHoursWorked(e.target.value)}
            required
          />
        </label>
        <label>
          שכר ששולם (₪)
          <input
            type="number"
            min="0"
            value={salaryPaid}
            onChange={(e) => setSalaryPaid(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>{saving ? "שומר..." : "שמירה"}</button>
      </form>
    </Modal>
  );
}
