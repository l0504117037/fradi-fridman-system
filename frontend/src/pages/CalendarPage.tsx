import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { appointmentsApi } from "../api/appointments";
import { customersApi } from "../api/customers";
import { Appointment, Customer } from "../api/types";
import {
  ALL_HOURS,
  DAY_NAMES,
  addDays,
  formatDateDisplay,
  formatDateISO,
  formatHebrewDate,
  formatHour,
  getRegularHours,
  getWeekStart,
} from "../utils/date";
import AppointmentActionModal from "../components/AppointmentActionModal";

const NOTE_TRUNCATE_LENGTH = 18;

export default function CalendarPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const weekStart = useMemo(() => {
    const param = searchParams.get("week");
    if (param) {
      const d = new Date(param);
      if (!isNaN(d.getTime())) return getWeekStart(d);
    }
    return getWeekStart(new Date());
  }, [searchParams]);

  const setWeekStart = (date: Date) => {
    setSearchParams({ week: formatDateISO(date) }, { replace: false });
  };
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addModal, setAddModal] = useState<{ date: Date; time: string } | null>(null);
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterName, setFilterName] = useState("");

  const apptMatch = (a: Appointment) =>
    !filterName ||
    `${a.customer.firstname} ${a.customer.lastname}`.includes(filterName);

  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    loadWeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  useEffect(() => {
    customersApi.list().then(setCustomers).catch(() => {});
  }, []);

  const loadWeek = async () => {
    setLoading(true);
    setError("");
    try {
      const start = formatDateISO(weekStart);
      const end = formatDateISO(addDays(weekStart, 6));
      const data = await appointmentsApi.listRange(start, end);
      setAppointments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const appointmentsForDay = (date: Date) => {
    const key = formatDateISO(date);
    return appointments
      .filter((a) => a.date.slice(0, 10) === key)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const goToCustomerHistory = (a: Appointment) => {
    navigate(`/customers/${a.customer._id}?highlightKind=${a.actionKind}&highlightId=${a.actionId}`);
  };

  const handleDeleteAppointment = async (a: Appointment) => {
    if (!window.confirm("למחוק את הפעולה הזו? הפעולה תימחק גם מכרטיס הלקוחה והמלאי יוחזר אם רלוונטי.")) {
      return;
    }
    try {
      await appointmentsApi.remove(a._id);
      loadWeek();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const renderChip = (a: Appointment) => {
    const note = a.note ?? "";
    const isExpanded = expandedNote === a._id;
    const showFull = !note || note.length <= NOTE_TRUNCATE_LENGTH || isExpanded;
    return (
      <div className="appt-chip" key={a._id} onClick={() => setEditAppointment(a)} style={{ opacity: apptMatch(a) ? 1 : 0.25 }}>
        <button
          className="chip-delete"
          title="מחיקה"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteAppointment(a);
          }}
        >
          ×
        </button>
        <button
          className="chip-history"
          title="להיסטוריית הלקוחה"
          onClick={(e) => {
            e.stopPropagation();
            goToCustomerHistory(a);
          }}
        >
          היסטוריה
        </button>
        <div className="chip-time">{a.time}</div>
        <div className="chip-customer">
          {a.customer.firstname} {a.customer.lastname}
        </div>
        <div className="chip-action">
          {a.actionLabel} - {a.actionPrice}₪
        </div>
        {note && (
          <div
            className="chip-note"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedNote(isExpanded ? null : a._id);
            }}
          >
            {showFull ? note : `${note.slice(0, NOTE_TRUNCATE_LENGTH)}...`}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="calendar-header">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))}>&larr; שבוע קודם</button>
        <h2>
          {formatDateDisplay(weekStart)} - {formatDateDisplay(addDays(weekStart, 5))}
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div className="search-box">
            <input
              className="search-input"
              type="date"
              title="קפוץ לתאריך"
              value={filterDate}
              onChange={e => {
                setFilterDate(e.target.value);
                if (e.target.value) setWeekStart(getWeekStart(new Date(e.target.value)));
              }}
              style={{ minWidth: 130 }}
            />
            {filterDate && <button className="search-reset" onClick={() => setFilterDate("")}>✕</button>}
          </div>
          <div className="search-box">
            <input
              className="search-input"
              placeholder="חיפוש לפי שם לקוחה"
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
              style={{ minWidth: 130 }}
            />
            {filterName && <button className="search-reset" onClick={() => setFilterName("")}>✕</button>}
          </div>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))}>שבוע הבא &rarr;</button>
          <button onClick={() => setWeekStart(getWeekStart(new Date()))}>היום</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p>טוען...</p>}

      <div className="calendar-table-wrapper">
        <table className="calendar-table">
          <thead>
            <tr>
              <th className="hour-col"></th>
              {days.map((day, i) => (
                <th key={i}>
                  <div>{DAY_NAMES[i]}</div>
                  <div>{formatDateDisplay(day)}</div>
                  <div className="hebrew-date">{formatHebrewDate(day)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_HOURS.map((hour) => (
              <tr key={hour}>
                <td className="hour-col">{formatHour(hour)}</td>
                {days.map((day, i) => {
                  const regular = getRegularHours(i);
                  if (!regular.includes(hour)) {
                    return <td key={i} className="calendar-cell disabled"></td>;
                  }
                  const cellAppointments = appointmentsForDay(day).filter(
                    (a) => parseInt(a.time, 10) === hour
                  );
                  return (
                    <td key={i} className="calendar-cell">
                      {cellAppointments.map(renderChip)}
                      <button
                        className="add-chip-btn"
                        onClick={() => setAddModal({ date: day, time: formatHour(hour) })}
                      >
                        +
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="hour-col extra-label">תוספות</td>
              {days.map((day, i) => {
                const regular = getRegularHours(i);
                const extras = appointmentsForDay(day).filter((a) => !regular.includes(parseInt(a.time, 10)));
                return (
                  <td key={i} className="calendar-cell extra-cell">
                    {extras.map(renderChip)}
                    <button className="add-chip-btn" onClick={() => setAddModal({ date: day, time: "" })}>
                      +
                    </button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {addModal && (
        <AppointmentActionModal
          customers={customers}
          initialDate={formatDateISO(addModal.date)}
          initialTime={addModal.time}
          onClose={() => setAddModal(null)}
          onDone={() => {
            setAddModal(null);
            loadWeek();
          }}
        />
      )}

      {editAppointment && (
        <AppointmentActionModal
          appointment={editAppointment}
          initialDate={editAppointment.date.slice(0, 10)}
          initialTime={editAppointment.time}
          onClose={() => setEditAppointment(null)}
          onDone={() => {
            setEditAppointment(null);
            loadWeek();
          }}
        />
      )}
    </div>
  );
}
