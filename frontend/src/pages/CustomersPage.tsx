import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { customersApi } from "../api/customers";
import { Customer } from "../api/types";
import Modal from "../components/Modal";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setCustomers(await customersApi.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page">
      <div className="toolbar">
        <h1>לקוחות</h1>
        <button className="btn" onClick={() => setShowModal(true)}>
          + לקוחה חדשה
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p>טוען...</p>}

      <table>
        <thead>
          <tr>
            <th>שם פרטי</th>
            <th>שם משפחה</th>
            <th>טלפון</th>
            <th>מייל</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c._id}>
              <td>{c.firstname}</td>
              <td>{c.lastname}</td>
              <td>{c.phone}</td>
              <td>{c.mail}</td>
              <td>
                <Link to={`/customers/${c._id}`}>כרטיס לקוחה</Link>
              </td>
            </tr>
          ))}
          {customers.length === 0 && !loading && (
            <tr>
              <td colSpan={5}>אין עדיין לקוחות</td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <NewCustomerModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function NewCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [phone, setPhone] = useState("");
  const [mail, setMail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await customersApi.create({ firstname, lastname, phone, mail });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="לקוחה חדשה" onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <label>
          שם פרטי
          <input value={firstname} onChange={(e) => setFirstname(e.target.value)} required />
        </label>
        <label>
          שם משפחה
          <input value={lastname} onChange={(e) => setLastname(e.target.value)} required />
        </label>
        <label>
          טלפון
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label>
          מייל
          <input type="email" value={mail} onChange={(e) => setMail(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>
          {saving ? "שומר..." : "שמירה"}
        </button>
      </form>
    </Modal>
  );
}
