import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { suppliersApi } from "../api/suppliers";
import { Supplier } from "../api/types";
import Modal from "../components/Modal";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setSuppliers(await suppliersApi.list());
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
        <h1>ספקים</h1>
        <button className="btn" onClick={() => setShowModal(true)}>
          + ספק חדש
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p>טוען...</p>}

      <table>
        <thead>
          <tr>
            <th>שם</th>
            <th>טלפון</th>
            <th>מייל</th>
            <th>יתרה לתשלום</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>{s.phone}</td>
              <td>{s.email}</td>
              <td className={(s.summary?.balance ?? 0) > 0 ? "balance-positive" : "balance-zero"}>
                {s.summary?.balance ?? 0}₪
              </td>
              <td>
                <Link to={`/suppliers/${s._id}`}>כרטיס ספק</Link>
              </td>
            </tr>
          ))}
          {suppliers.length === 0 && !loading && (
            <tr>
              <td colSpan={5}>אין עדיין ספקים</td>
            </tr>
          )}
        </tbody>
      </table>

      {showModal && (
        <NewSupplierModal
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

function NewSupplierModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await suppliersApi.create({ name, phone, email, address, notes });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="ספק חדש" onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <label>
          שם
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          טלפון
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          מייל
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          כתובת
          <input value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>
        <label>
          הערות
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>
          {saving ? "שומר..." : "שמירה"}
        </button>
      </form>
    </Modal>
  );
}
