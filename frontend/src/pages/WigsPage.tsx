import { FormEvent, useEffect, useState } from "react";
import { wigsApi } from "../api/wigs";
import { suppliersApi } from "../api/suppliers";
import { Supplier, Wig } from "../api/types";
import Modal from "../components/Modal";

export default function WigsPage() {
  const [wigs, setWigs] = useState<Wig[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Wig | "new" | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setWigs(await wigsApi.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    suppliersApi.list().then(setSuppliers).catch(() => {});
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את הפאה?")) return;
    await wigsApi.remove(id);
    load();
  };

  const supplierName = (wig: Wig) => {
    if (!wig.supplier) return "-";
    if (typeof wig.supplier === "string") return suppliers.find((s) => s._id === wig.supplier)?.name ?? "-";
    return wig.supplier.name;
  };

  return (
    <div className="page">
      <div className="toolbar">
        <h1>פאות</h1>
        <button className="btn" onClick={() => setEditing("new")}>
          + פאה חדשה
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p>טוען...</p>}

      <table>
        <thead>
          <tr>
            <th>קוד</th>
            <th>שם / דגם</th>
            <th>צבע</th>
            <th>מידה</th>
            <th>מחיר</th>
            <th>כמות</th>
            <th>אחריות (חודשים)</th>
            <th>ספק</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {wigs.map((w) => (
            <tr key={w._id}>
              <td>{w.code || "-"}</td>
              <td>{w.name}</td>
              <td>{w.color || "-"}</td>
              <td>{w.size || "-"}</td>
              <td>{w.price}₪</td>
              <td>{w.quantity}</td>
              <td>{w.warrantyTime}</td>
              <td>{supplierName(w)}</td>
              <td>
                <button className="link-btn" onClick={() => setEditing(w)}>
                  עריכה
                </button>{" "}
                <button className="link-btn" onClick={() => handleDelete(w._id)}>
                  מחיקה
                </button>
              </td>
            </tr>
          ))}
          {wigs.length === 0 && !loading && (
            <tr>
              <td colSpan={9}>אין עדיין פאות</td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && (
        <WigModal
          wig={editing === "new" ? null : editing}
          suppliers={suppliers}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function WigModal({
  wig,
  suppliers,
  onClose,
  onDone,
}: {
  wig: Wig | null;
  suppliers: Supplier[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [code, setCode] = useState(wig?.code ?? "");
  const [name, setName] = useState(wig?.name ?? "");
  const [color, setColor] = useState(wig?.color ?? "");
  const [size, setSize] = useState(wig?.size ?? "");
  const [price, setPrice] = useState<number | "">(wig?.price ?? "");
  const [quantity, setQuantity] = useState<number | "">(wig?.quantity ?? "");
  const [warrantyTime, setWarrantyTime] = useState<number | "">(wig?.warrantyTime ?? "");
  const [supplier, setSupplier] = useState(typeof wig?.supplier === "string" ? wig.supplier : wig?.supplier?._id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = {
        code: code || undefined,
        name,
        color: color || undefined,
        size: size || undefined,
        price: Number(price),
        quantity: Number(quantity),
        warrantyTime: Number(warrantyTime),
        supplier: supplier || undefined,
      };
      if (wig) {
        await wigsApi.update(wig._id, data);
      } else {
        await wigsApi.create(data);
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={wig ? "עריכת פאה" : "פאה חדשה"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <label>
          קוד
          <input value={code} onChange={(e) => setCode(e.target.value)} />
        </label>
        <label>
          שם / דגם
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          צבע
          <input value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
        <label>
          מידה
          <input value={size} onChange={(e) => setSize(e.target.value)} />
        </label>
        <label>
          מחיר
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
            required
          />
        </label>
        <label>
          כמות במלאי
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
            required
          />
        </label>
        <label>
          אחריות (חודשים)
          <input
            type="number"
            value={warrantyTime}
            onChange={(e) => setWarrantyTime(e.target.value === "" ? "" : Number(e.target.value))}
            required
          />
        </label>
        <label>
          ספק
          <select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
            <option value="">ללא</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>
          {saving ? "שומר..." : "שמירה"}
        </button>
      </form>
    </Modal>
  );
}
