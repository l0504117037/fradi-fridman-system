import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentsApi } from "../api/appointments";
import { customersApi } from "../api/customers";
import { Appointment, Customer } from "../api/types";
import {
  ALL_HOURS,
  DAY_NAMES,
  addDays,
  formatDateDisplay,
  formatDateISO,
  formatHour,
  getRegularHours,
  getWeekStart,
} from "../utils/date";
import AppointmentActionModal from "../components/AppointmentActionModal";

const NOTE_TRUNCATE_LENGTH = 18;

export default function CalendarPage() {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addModal, setAddModal] = useState<{ date: Date; time: string } | null>(null);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

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

  const goToCustomer = (a: Appointment) => {
    navigate(`/customers/${a.customer._id}?highlightKind=${a.actionKind}&highlightId=${a.actionId}`);
  };

  const renderChip = (a: Appointment) => {
    const note = a.note ?? "";
    const isExpanded = expandedNote === a._id;
    const showFull = !note || note.length <= NOTE_TRUNCATE_LENGTH || isExpanded;
    return (
      <div className="appt-chip" key={a._id} onClick={() => goToCustomer(a)}>
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
        <button onClick={() => setWeekStart(addDays(weekStart, 7))}>שבוע הבא &rarr;</button>
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
    </div>
  );
}
