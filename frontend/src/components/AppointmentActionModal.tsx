import { FormEvent, useEffect, useState } from "react";
import { appointmentsApi } from "../api/appointments";
import { productsApi } from "../api/products";
import { wigsApi } from "../api/wigs";
import { servicesApi } from "../api/services";
import { ActionKind, Appointment, Customer, Product, ServiceItem, UpdateAppointmentInput, Wig } from "../api/types";
import Modal from "./Modal";

interface AppointmentActionModalProps {
  // אם יש רשימת לקוחות - יוצג בחירת לקוחה (לדוגמה: מהלוח שנה)
  customers?: Customer[];
  // אם הלקוחה כבר ידועה (לדוגמה: מכרטיס הלקוחה)
  fixedCustomer?: Customer;
  // אם מועבר - המודאל ייפתח במצב עדכון של תור קיים
  appointment?: Appointment;
  initialDate: string; // YYYY-MM-DD
  initialTime?: string; // HH:MM
  onClose: () => void;
  onDone: () => void;
}

export default function AppointmentActionModal({
  customers,
  fixedCustomer,
  appointment,
  initialDate,
  initialTime,
  onClose,
  onDone,
}: AppointmentActionModalProps) {
  const isEdit = !!appointment;

  const [customerId, setCustomerId] = useState(appointment?.customer._id ?? fixedCustomer?._id ?? "");
  const [date, setDate] = useState(appointment ? appointment.date.slice(0, 10) : initialDate);
  const [time, setTime] = useState(appointment?.time ?? initialTime ?? "");
  type ActionSelection = "service" | "Product" | "Wig";
  const [actionSelection, setActionSelection] = useState<ActionSelection>(() => {
    if (appointment?.actionKind === "purchase") {
      return appointment?.refItemType === "Wig" ? "Wig" : "Product";
    }
    return "service";
  });
  const actionType: ActionKind = actionSelection === "service" ? "service" : "purchase";
  const itemType: "Product" | "Wig" | undefined = actionSelection !== "service" ? actionSelection : undefined;
  const [products, setProducts] = useState<Product[]>([]);
  const [wigs, setWigs] = useState<Wig[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [itemId, setItemId] = useState(appointment?.refItemId ?? "");
  const [price, setPrice] = useState<number | "">(appointment?.actionPrice ?? "");
  const [note, setNote] = useState(appointment?.note ?? "");
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // האם המשתמשת שינתה את פרטי הפעולה (סוג/פריט/שירות/מחיר) במצב עדכון
  const [actionChanged, setActionChanged] = useState(false);

  useEffect(() => {
    productsApi.list().then(setProducts).catch(() => {});
    wigsApi.list().then(setWigs).catch(() => {});
    servicesApi.list().then(setServices).catch(() => {});
  }, []);

  const items: Array<Product | Wig> = actionSelection === "Wig" ? wigs : products;

  const handleItemChange = (id: string) => {
    setItemId(id);
    setActionChanged(true);
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
    if (!isEdit && !customerId) {
      setError("יש לבחור לקוחה");
      return;
    }
    if (!date || !time) {
      setError("יש להזין תאריך ושעה");
      return;
    }
    if (!itemId && (!isEdit || actionChanged)) {
      setError("יש לבחור פריט / שירות");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isEdit && appointment) {
        const payload: UpdateAppointmentInput = {
          date,
          time,
          note: note || undefined,
        };

        // שולחים את פרטי הפעולה (פריט/שירות/מחיר) רק אם הם שונו בפועל,
        // כדי לא ליצור רשומת רכישה/שירות חדשה ולמחוק את הקיימת (כולל היסטוריית תשלומים) ללא צורך
        if (actionChanged) {
          payload.actionKind = actionType;
          payload.itemType = actionType === "purchase" ? itemType : undefined;
          payload.itemId = actionType === "purchase" ? itemId : undefined;
          payload.totalPrice = actionType === "purchase" ? (price === "" ? undefined : Number(price)) : undefined;
          payload.serviceId = actionType === "service" ? itemId : undefined;
          payload.price = actionType === "service" ? (price === "" ? undefined : Number(price)) : undefined;
        }

        await appointmentsApi.update(appointment._id, payload);
      } else {
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
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "עדכון תור ופעולה" : "הוספת תור ופעולה"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        {isEdit ? (
          <p>
            לקוחה: <strong>{appointment!.customer.firstname} {appointment!.customer.lastname}</strong>
          </p>
        ) : customers ? (
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
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                e.target.blur();
              }}
            />
          </label>
          <label>
            שעה
            <input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                e.target.blur();
              }}
            />
          </label>
        </div>

        <label>
          סוג פעולה
          <select
            value={actionSelection}
            onChange={(e) => {
              setActionSelection(e.target.value as ActionSelection);
              setItemId("");
              setPrice("");
              setActionChanged(true);
            }}
          >
            <option value="service">שירות</option>
            <option value="Product">מוצר</option>
            <option value="Wig">פאה</option>
          </select>
        </label>

        <label>
          {actionSelection === "service" ? "שירות" : actionSelection === "Wig" ? "פאה" : "מוצר"}
          <select value={itemId} onChange={(e) => handleItemChange(e.target.value)}>
            <option value="">בחרי</option>
            {actionSelection === "service"
              ? services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} - {s.price}₪
                  </option>
                ))
              : items.map((i) => (
                  <option key={i._id} value={i._id} disabled={i.quantity <= 0}>
                    {actionSelection === "Wig"
                      ? `${(i as Wig).name} (${(i as Wig).category === "boutique" ? "בוטיק" : "סטנדרט"})`
                      : (i as Product).type} - {i.price}₪
                    {i.quantity <= 0 ? " (אין במלאי)" : ` (${i.quantity} במלאי)`}
                  </option>
                ))}
          </select>
        </label>

        <label>
          מחיר
          <input
            type="number"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value === "" ? "" : Number(e.target.value));
              setActionChanged(true);
            }}
          />
        </label>

        <label>
          הערה (מה הלקוחה רוצה)
          <textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        {!isEdit && (
          <label>
            תשלום ראשוני (אופציונלי)
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </label>
        )}

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={saving}>
          {saving ? "שומר..." : isEdit ? "שמור" : "שמירה"}
        </button>
      </form>
    </Modal>
  );
}
