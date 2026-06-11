import { FormEvent, useEffect, useState } from "react";
import { appointmentsApi } from "../api/appointments";
import { productsApi } from "../api/products";
import { wigsApi } from "../api/wigs";
import { servicesApi } from "../api/services";
import { ActionKind, Customer, Product, ServiceItem, Wig } from "../api/types";
import Modal from "./Modal";

interface AppointmentActionModalProps {
  // אם יש רשימת לקוחות - יוצג בחירת לקוחה (לדוגמה: מהלוח שנה)
  customers?: Customer[];
  // אם הלקוחה כבר ידועה (לדוגמה: מכרטיס הלקוחה)
  fixedCustomer?: Customer;
  initialDate: string; // YYYY-MM-DD
  initialTime?: string; // HH:MM
  onClose: () => void;
  onDone: () => void;
}

export default function AppointmentActionModal({
  customers,
  fixedCustomer,
  initialDate,
  initialTime,
  onClose,
  onDone,
}: AppointmentActionModalProps) {
  const [customerId, setCustomerId] = useState(fixedCustomer?._id ?? "");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime ?? "");
  const [actionType, setActionType] = useState<ActionKind>("service");
  const [itemType, setItemType] = useState<"Product" | "Wig">("Product");
  const [products, setProducts] = useState<Product[]>([]);
  const [wigs, setWigs] = useState<Wig[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [itemId, setItemId] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    productsApi.list().then(setProducts).catch(() => {});
    wigsApi.list().then(setWigs).catch(() => {});
    servicesApi.list().then(setServices).catch(() => {});
  }, []);

  const items: Array<Product | Wig> = itemType === "Product" ? products : wigs;

  const handleItemChange = (id: string) => {
    setItemId(id);
    if (actionType === "purchase") {
      const item = items.find((i) => i._id === id);
      if (item) setPrice(item.price);
    } else {
      const service = services.find((s) => s._id === id);
      if (service) setPrice(service.price);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError("יש לבחור לקוחה");
      return;
    }
    if (!date || !time) {
      setError("יש להזין תאריך ושעה");
      return;
    }
    if (!itemId) {
      setError("יש לבחור פריט / שירות");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payment =
        paymentAmount !== "" && Number(paymentAmount) > 0 ? { amount: Number(paymentAmount) } : undefined;

      await appointmentsApi.create({
        customer: customerId,
        date,
        time,
        note: note || undefined,
        actionKind: actionType,
        itemType: actionType === "purchase" ? itemType : undefined,
        itemId: actionType === "purchase" ? itemId : undefined,
        totalPrice: actionType === "purchase" ? (price === "" ? undefined : Number(price)) : undefined,
        serviceId: actionType === "service" ? itemId : undefined,
        price: actionType === "service" ? (price === "" ? undefined : Number(price)) : undefined,
        payment,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="הוספת תור ופעולה" onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        {customers ? (
          <label>
            לקוחה
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">בחרי לקוחה</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.firstname} {c.lastname}
                </option>
              ))}
            </select>
          </label>
        ) : (
          fixedCustomer && (
            <p>
              לקוחה: <strong>{fixedCustomer.firstname} {fixedCustomer.lastname}</strong>
            </p>
          )
        )}

        <div className="form-row">
          <label>
            תאריך
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            שעה
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>

        <label>
          סוג פעולה
          <select
            value={actionType}
            onChange={(e) => {
              setActionType(e.target.value as ActionKind);
              setItemId("");
              setPrice("");
            }}
          >
            <option value="service">שירות</option>
            <option value="purchase">רכישת מוצר / פאה</option>
          </select>
        </label>

        {actionType === "purchase" && (
          <label>
            סוג פריט
            <select
              value={itemType}
              onChange={(e) => {
                setItemType(e.target.value as "Product" | "Wig");
                setItemId("");
                setPrice("");
              }}
            >
              <option value="Product">מוצר</option>
              <option value="Wig">פאה</option>
            </select>
          </label>
        )}

        <label>
          {actionType === "purchase" ? "פריט" : "שירות"}
          <select value={itemId} onChange={(e) => handleItemChange(e.target.value)}>
            <option value="">בחרי</option>
            {actionType === "purchase"
              ? items.map((i) => (
                  <option key={i._id} value={i._id}>
                    {itemType === "Wig" ? (i as Wig).name : (i as Product).type} - {i.price}₪
                  </option>
                ))
              : services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} - {s.price}₪
                  </option>
                ))}
          </select>
        </label>

        <label>
          מחיר
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </label>

        <label>
          הערה (מה הלקוחה רוצה)
          <textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        <label>
          תשלום ראשוני (אופציונלי)
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))}
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
