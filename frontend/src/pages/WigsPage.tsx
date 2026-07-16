import { FormEvent, useEffect, useState } from "react";
import { wigsApi } from "../api/wigs";
import { suppliersApi } from "../api/suppliers";
import { reportsApi } from "../api/reports";
import { MonthlySummaryReport, Supplier, Wig } from "../api/types";
import Modal from "../components/Modal";
import MonthlySummaryModal from "../components/MonthlySummaryModal";

export default function WigsPage() {
  const [wigs, setWigs] = useState<Wig[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Wig | "new" | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryReport | null>(null);
  const [summaryTarget, setSummaryTarget] = useState<{ type: "customer" | "hairdresser"; cat: "boutique" | "standard" } | null>(null);
  const [search, setSearch] = useState("");

  const load = async (q = search) => {
    setLoading(true);
    setError("");
    try {
      setWigs(await wigsApi.list(q ? { search: q } : undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(search);
    suppliersApi.list().then(setSuppliers).catch(() => {});
  }, [search]);

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

  const openSummary = async (type: "customer" | "hairdresser", cat: "boutique" | "standard") => {
    try {
      setMonthlySummary(await reportsApi.monthlySummary());
      setSummaryTarget({ type, cat });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="page">
      <div className="toolbar">
        <h1>פאות</h1>
        <div className="search-box">
          <input className="search-input" placeholder="חיפוש לפי שם / קוד / צבע" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="search-reset" onClick={() => setSearch("")}>✕</button>}
        </div>
        <div>
          <button className="btn btn-secondary" onClick={() => openSummary("customer", "boutique")}>לקוחות - בוטיק</button>{" "}
          <button className="btn btn-secondary" onClick={() => openSummary("customer", "standard")}>לקוחות - סטנדרט</button>{" "}
          <button className="btn btn-secondary" onClick={() => openSummary("hairdresser", "boutique")}>פאניות - בוטיק</button>{" "}
          <button className="btn btn-secondary" onClick={() => openSummary("hairdresser", "standard")}>פאניות - סטנדרט</button>{" "}
          <button className="btn" onClick={() => setEditing("new")}>
            + פאה חדשה
          </button>
        </div>
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
            <th>קטגוריה</th>
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
              <td>{w.category === "boutique" ? "בוטיק" : "סטנדרט"}</td>
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
              <td colSpan={10}>אין עדיין פאות</td>
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

      {monthlySummary && summaryTarget && (() => {
        const catHeb = summaryTarget.cat === "boutique" ? "(בוטיק)" : "(סטנדרט)";
        const entries = summaryTarget.type === "customer"
          ? monthlySummary.customerWigs.filter(e => e.itemName.includes(catHeb))
          : monthlySummary.hairdresserWigs.filter(e => e.itemName.includes(catHeb));
        const title = `סיכום ${summaryTarget.type === "customer" ? "לקוחות" : "פאניות"} — ${summaryTarget.cat === "boutique" ? "בוטיק" : "סטנדרט"}`;
        return (
          <MonthlySummaryModal
            title={title}
            entries={entries}
            onClose={() => { setMonthlySummary(null); setSummaryTarget(null); }}
          />
        );
      })()}
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
  const [category, setCategory] = useState<"boutique" | "standard">(wig?.category ?? "standard");
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
        category,
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
          קטגוריה
          <select value={category} onChange={(e) => setCategory(e.target.value as "boutique" | "standard")}>
            <option value="standard">סטנדרט</option>
            <option value="boutique">בוטיק</option>
          </select>
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
