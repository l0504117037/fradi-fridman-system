import { FormEvent, useEffect, useState } from "react";
import { servicesApi } from "../api/services";
import { reportsApi } from "../api/reports";
import { MonthlySummaryReport, ServiceItem } from "../api/types";
import Modal from "../components/Modal";
import MonthlySummaryModal from "../components/MonthlySummaryModal";

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<ServiceItem | "new" | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryReport | null>(null);
  const [search, setSearch] = useState("");

  const load = async (q = search) => {
    setLoading(true);
    setError("");
    try {
      setServices(await servicesApi.list(q ? { search: q } : undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(search); }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את השירות?")) return;
    await servicesApi.remove(id);
    load();
  };

  const openSummary = async () => {
    try {
      setMonthlySummary(await reportsApi.monthlySummary());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="page">
      <div className="toolbar">
        <h1>שירותים</h1>
        <div className="search-box">
          <input className="search-input" placeholder="חיפוש לפי שם שירות" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="search-reset" onClick={() => setSearch("")}>✕</button>}
        </div>
        <div>
          <button className="btn btn-secondary" onClick={openSummary}>
            סיכום חודשי
          </button>{" "}
          <button className="btn" onClick={() => setEditing("new")}>
            + שירות חדש
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p>טוען...</p>}

      <table>
        <thead>
          <tr>
            <th>שם</th>
            <th>מחיר</th>
            <th>משך (דקות)</th>
            <th>תיאור</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>{s.price}₪</td>
              <td>{s.duration ?? "-"}</td>
              <td>{s.description || "-"}</td>
              <td>
                <button className="link-btn" onClick={() => setEditing(s)}>
                  עריכה
                </button>{" "}
                <button className="link-btn" onClick={() => handleDelete(s._id)}>
                  מחיקה
                </button>
              </td>
            </tr>
          ))}
          {services.length === 0 && !loading && (
            <tr>
              <td colSpan={5}>אין עדיין שירותים</td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && (
        <ServiceModal
          service={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {monthlySummary && (
        <MonthlySummaryModal
          title="סיכום חודשי - שירותים"
          entries={monthlySummary.services}
          onClose={() => setMonthlySummary(null)}
        />
      )}
    </div>
  );
}

function ServiceModal({
  service,
  onClose,
  onDone,
}: {
  service: ServiceItem | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(service?.name ?? "");
  const [price, setPrice] = useState<number | "">(service?.price ?? "");
  const [duration, setDuration] = useState<number | "">(service?.duration ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = {
        name,
        price: Number(price),
        duration: duration === "" ? undefined : Number(duration),
        description: description || undefined,
      };
      if (service) {
        await servicesApi.update(service._id, data);
      } else {
        await servicesApi.create(data);
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={service ? "עריכת שירות" : "שירות חדש"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <label>
          שם השירות
          <input value={name} onChange={(e) => setName(e.target.value)} required />
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
          משך (דקות)
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </label>
        <label>
          תיאור
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>
          {saving ? "שומר..." : "שמירה"}
        </button>
      </form>
    </Modal>
  );
}
