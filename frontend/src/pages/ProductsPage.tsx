import { FormEvent, useEffect, useState } from "react";
import { productsApi } from "../api/products";
import { Product } from "../api/types";
import Modal from "../components/Modal";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setProducts(await productsApi.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את המוצר?")) return;
    await productsApi.remove(id);
    load();
  };

  return (
    <div className="page">
      <div className="toolbar">
        <h1>מוצרים</h1>
        <button className="btn" onClick={() => setEditing("new")}>
          + מוצר חדש
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p>טוען...</p>}

      <table>
        <thead>
          <tr>
            <th>סוג</th>
            <th>מחיר</th>
            <th>כמות</th>
            <th>אחריות (חודשים)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td>{p.type}</td>
              <td>{p.price}₪</td>
              <td>{p.quantity}</td>
              <td>{p.warrantyTime}</td>
              <td>
                <button className="link-btn" onClick={() => setEditing(p)}>
                  עריכה
                </button>{" "}
                <button className="link-btn" onClick={() => handleDelete(p._id)}>
                  מחיקה
                </button>
              </td>
            </tr>
          ))}
          {products.length === 0 && !loading && (
            <tr>
              <td colSpan={5}>אין עדיין מוצרים</td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && (
        <ProductModal
          product={editing === "new" ? null : editing}
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

function ProductModal({
  product,
  onClose,
  onDone,
}: {
  product: Product | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [type, setType] = useState(product?.type ?? "");
  const [price, setPrice] = useState<number | "">(product?.price ?? "");
  const [quantity, setQuantity] = useState<number | "">(product?.quantity ?? "");
  const [warrantyTime, setWarrantyTime] = useState<number | "">(product?.warrantyTime ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = {
        type,
        price: Number(price),
        quantity: Number(quantity),
        warrantyTime: Number(warrantyTime),
      };
      if (product) {
        await productsApi.update(product._id, data);
      } else {
        await productsApi.create(data);
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={product ? "עריכת מוצר" : "מוצר חדש"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <label>
          סוג מוצר
          <input value={type} onChange={(e) => setType(e.target.value)} required />
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
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>
          {saving ? "שומר..." : "שמירה"}
        </button>
      </form>
    </Modal>
  );
}
